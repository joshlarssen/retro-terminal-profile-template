import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const scriptPath = path.join(__dirname, 'sync-profile-data.py');

const candidates =
  process.platform === 'win32'
    ? [
        ['py', ['-3']],
        ['python', []],
        ['python3', []]
      ]
    : [
        ['python3', []],
        ['python', []],
        ['py', ['-3']]
      ];

function hasInterpreter(command, args) {
  const result = spawnSync(command, [...args, '--version'], {
    stdio: 'ignore',
    shell: false
  });

  return !result.error && result.status === 0;
}

for (const [command, args] of candidates) {
  if (!hasInterpreter(command, args)) {
    continue;
  }

  const result = spawnSync(command, [...args, scriptPath], {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 0);
}

console.error(
  [
    'No usable Python interpreter was found.',
    'Tried: py -3, python, python3.',
    'On Windows, install Python with the Python Launcher enabled, then retry.'
  ].join('\n')
);
process.exit(1);
