import http from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PNG } from 'pngjs';
import gifenc from 'gifenc';
import { profileData } from '../src/profile-data.js';
import { ensurePlaywrightChromiumInstalled } from './ensure-playwright-browser.mjs';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const assetDir = path.join(rootDir, 'assets');
const outputPath = path.join(assetDir, 'profile-teaser.gif');
const FRAME_WIDTH = 1136;
const FRAME_HEIGHT = 876;
const CAPTURE_PADDING = 24;
const CLIP_MARGIN = 16;
const gifConfig = profileData.teaserGif ?? {};
const stepDelayMs = gifConfig.stepDelayMs ?? 1100;
const edgeDelayMs = Math.min(stepDelayMs + 500, 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.gif': 'image/gif',
  '.json': 'application/json; charset=utf-8'
};

const steps = (profileData.modules ?? []).flatMap((module, moduleIndex, modules) =>
  (module.items ?? []).map((item, itemIndex, items) => {
    const isFirst = moduleIndex === 0 && itemIndex === 0;
    const isLast = moduleIndex === modules.length - 1 && itemIndex === items.length - 1;

    return {
      module: module.label,
      item: item.label,
      delay: isFirst || isLast ? edgeDelayMs : stepDelayMs
    };
  })
);

function createServer(rootPath) {
  return http.createServer(async (request, response) => {
    try {
      const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
      const relativePath = requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname;
      const filePath = path.normalize(path.join(rootPath, decodeURIComponent(relativePath)));

      if (!filePath.startsWith(rootPath)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const file = await readFile(filePath);
      const ext = path.extname(filePath);
      response.writeHead(200, {
        'Content-Type': mimeTypes[ext] ?? 'application/octet-stream',
        'Cache-Control': 'no-store'
      });
      response.end(file);
    } catch (error) {
      response.writeHead(404);
      response.end('Not found');
    }
  });
}

function concatFrameData(frames) {
  const totalSize = frames.reduce((sum, frame) => sum + frame.png.data.length, 0);
  const merged = new Uint8Array(totalSize);
  let offset = 0;

  for (const frame of frames) {
    merged.set(frame.png.data, offset);
    offset += frame.png.data.length;
  }

  return merged;
}

async function clickByText(page, selector, text) {
  const locator = page.locator(selector).filter({ hasText: text }).first();
  await locator.click();
}

async function captureShellFrame(page, clip) {
  const pngBuffer = await page.screenshot({
    type: 'png',
    omitBackground: true,
    clip
  });

  return PNG.sync.read(pngBuffer);
}

function normalizeTransparentPixels(png, alphaThreshold = 32) {
  const data = png.data;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] <= alphaThreshold) {
      data[index] = 0;
      data[index + 1] = 0;
      data[index + 2] = 0;
      data[index + 3] = 0;
    }
  }

  return png;
}

const chromium = await ensurePlaywrightChromiumInstalled();

const server = createServer(rootDir);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

const address = server.address();
if (!address || typeof address === 'string') {
  throw new Error('Could not determine local preview server address.');
}

let browser;

try {
  browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {
      width: FRAME_WIDTH + CAPTURE_PADDING * 2,
      height: FRAME_HEIGHT + CAPTURE_PADDING * 2
    },
    deviceScaleFactor: 1
  });

  await page.goto(`http://127.0.0.1:${address.port}`, { waitUntil: 'networkidle' });
  await page.locator('.shell').waitFor();
  await page.addStyleTag({
    content: `
      html,
      body {
        background: transparent !important;
      }

      body {
        margin: 0 !important;
        padding: ${CAPTURE_PADDING}px !important;
        overflow: hidden !important;
      }

      .shell {
        width: ${FRAME_WIDTH}px !important;
        max-width: ${FRAME_WIDTH}px !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    `
  });
  await page.waitForTimeout(120);

  const shellBox = await page.locator('.shell').boundingBox();
  if (!shellBox) {
    throw new Error('Could not determine shell bounds for GIF capture.');
  }

  const clip = {
    x: Math.max(0, Math.floor(shellBox.x) - CLIP_MARGIN),
    y: Math.max(0, Math.floor(shellBox.y) - CLIP_MARGIN),
    width: Math.ceil(shellBox.width) + CLIP_MARGIN * 2,
    height: Math.ceil(shellBox.height) + CLIP_MARGIN * 2
  };

  const frames = [];

  for (const step of steps) {
    await clickByText(page, '.tab-button', step.module);
    await clickByText(page, '.item-button', step.item);
    await page.waitForTimeout(220);

    frames.push({
      delay: step.delay,
      png: normalizeTransparentPixels(await captureShellFrame(page, clip))
    });
  }

  if (frames.length === 0) {
    throw new Error('No frames captured for teaser GIF.');
  }

  const firstFrame = frames[0].png;
  const palette = quantize(concatFrameData(frames), 256, {
    format: 'rgba4444',
    oneBitAlpha: true
  });
  const transparentIndex = palette.findIndex((entry) => entry[3] === 0);
  const gif = GIFEncoder();

  frames.forEach((frame, index) => {
    const indexed = applyPalette(frame.png.data, palette, 'rgba4444');
    gif.writeFrame(indexed, firstFrame.width, firstFrame.height, {
      palette: index === 0 ? palette : undefined,
      repeat: index === 0 ? 0 : undefined,
      delay: frame.delay,
      transparent: transparentIndex !== -1,
      transparentIndex: transparentIndex === -1 ? 0 : transparentIndex
    });
  });

  gif.finish();

  await mkdir(assetDir, { recursive: true });
  await writeFile(outputPath, Buffer.from(gif.bytes()));

  console.log(`Generated ${outputPath}`);
} finally {
  if (browser) {
    await browser.close();
  }

  if (server.listening) {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  }
}
