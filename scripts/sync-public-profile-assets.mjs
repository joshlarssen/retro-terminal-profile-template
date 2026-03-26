import { copyFile, mkdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { profileData } from '../src/profile-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const targetArgument = process.argv.find((value) => value.startsWith('--target='));
const explicitTargetRepoPath = process.env.PROFILE_REPO_PATH ?? (targetArgument ? targetArgument.slice('--target='.length) : '');
const owner = String(profileData.owner ?? '').trim();
const skipProfileSync = process.env.SKIP_PROFILE_SYNC === '1';

function isPlaceholderOwner(value) {
  return !value || /^your[-_]/i.test(value) || value === 'your-github-username';
}

async function targetExists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (skipProfileSync) {
    console.log('Skipping public profile sync because SKIP_PROFILE_SYNC=1.');
    return;
  }

  const implicitTargetRepoPath = isPlaceholderOwner(owner) ? '' : path.resolve(rootDir, '..', owner);
  const targetRepoPath = explicitTargetRepoPath || implicitTargetRepoPath;

  if (!targetRepoPath) {
    console.log(
      'Skipping public profile sync: set `owner` in profile.config.yaml or provide PROFILE_REPO_PATH when you are ready to publish.'
    );
    return;
  }

  const resolvedTargetRepoPath = path.resolve(targetRepoPath);
  const foundTargetRepo = await targetExists(resolvedTargetRepoPath);

  if (!foundTargetRepo) {
    if (explicitTargetRepoPath) {
      throw new Error(`Profile repo not found at ${resolvedTargetRepoPath}`);
    }

    console.log(
      `Skipping public profile sync: no sibling profile repo found at ${resolvedTargetRepoPath}. ` +
        'Create that repo, update `owner`, or use PROFILE_REPO_PATH later.'
    );
    return;
  }

  const assetPairs = [['profile-teaser.gif', 'profile-teaser.gif']];

  await mkdir(path.join(resolvedTargetRepoPath, 'assets'), { recursive: true });
  await rm(path.join(resolvedTargetRepoPath, 'assets', 'profile-static.svg'), { force: true });

  for (const [sourceName, destinationName] of assetPairs) {
    await copyFile(
      path.join(rootDir, 'assets', sourceName),
      path.join(resolvedTargetRepoPath, 'assets', destinationName)
    );
  }

  console.log(`Synced GIF teaser to ${resolvedTargetRepoPath}`);
}

await main();
