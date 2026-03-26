import { spawn } from 'node:child_process';
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const configPath = path.join(rootDir, 'profile.config.yaml');
const teaserGifPath = path.join(rootDir, 'assets', 'profile-teaser.gif');
const showcaseDir = path.join(rootDir, 'assets', 'readme');

const scenarios = [
  { output: 'theme-vault-green.gif', themePreset: 'vault-green', stepDelayMs: 1400 },
  { output: 'theme-amber-radar.gif', themePreset: 'amber-radar', stepDelayMs: 1400 },
  { output: 'theme-arctic-signal.gif', themePreset: 'arctic-signal', stepDelayMs: 1400 },
  { output: 'theme-mono-slate.gif', themePreset: 'mono-slate', stepDelayMs: 1400 },
  { output: 'timing-700ms.gif', themePreset: 'arctic-signal', stepDelayMs: 700 },
  { output: 'timing-1400ms.gif', themePreset: 'arctic-signal', stepDelayMs: 1400 },
  { output: 'timing-2400ms.gif', themePreset: 'arctic-signal', stepDelayMs: 2400 }
];

function getCommandName(command) {
  return process.platform === 'win32' ? `${command}.cmd` : command;
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(getCommandName(command), args, {
      cwd: rootDir,
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

      reject(new Error(`Command failed: ${command} ${args.join(' ')}`));
    });
  });
}

function applyScenario(configContent, scenario) {
  return configContent
    .replace(/^themePreset:\s*.+$/m, `themePreset: ${scenario.themePreset}`)
    .replace(/^(\s*)stepDelayMs:\s*\d+\s*$/m, `$1stepDelayMs: ${scenario.stepDelayMs}`);
}

const originalConfig = await readFile(configPath, 'utf8');

try {
  await mkdir(showcaseDir, { recursive: true });

  for (const scenario of scenarios) {
    console.log(`Generating ${scenario.output}...`);
    await writeFile(configPath, applyScenario(originalConfig, scenario), 'utf8');
    await run('npm', ['run', 'config']);
    await run('node', ['scripts/generate-teaser-gif.mjs']);
    await copyFile(teaserGifPath, path.join(showcaseDir, scenario.output));
  }
} finally {
  await writeFile(configPath, originalConfig, 'utf8');
  await run('npm', ['run', 'config']);
}

console.log(`Generated README showcase GIFs in ${showcaseDir}`);
