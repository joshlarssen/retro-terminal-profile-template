import { spawn } from 'node:child_process';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const localPlaywrightCliPath = path.join(rootDir, 'node_modules', 'playwright', 'cli.js');

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';

function isMainModule() {
  return process.argv[1] ? import.meta.url === pathToFileURL(process.argv[1]).href : false;
}

function runNodeScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: process.env.PLAYWRIGHT_BROWSERS_PATH ?? '0'
      }
    });

    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed: node ${path.relative(rootDir, scriptPath)} ${args.join(' ')}`.trim()));
    });
  });
}

export async function getPlaywrightChromium() {
  process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';
  const playwright = await import('playwright');
  return playwright.chromium;
}

export async function ensurePlaywrightChromiumInstalled() {
  const chromium = await getPlaywrightChromium();

  try {
    await access(chromium.executablePath());
    return chromium;
  } catch {
    console.log('Installing project-local Playwright Chromium...');
  }

  await runNodeScript(localPlaywrightCliPath, ['install', 'chromium']);

  try {
    await access(chromium.executablePath());
    return chromium;
  } catch {
    throw new Error(
      'Playwright Chromium is still unavailable after automatic installation. Try `node node_modules/playwright/cli.js install chromium`.'
    );
  }
}

if (isMainModule()) {
  await ensurePlaywrightChromiumInstalled();
}
