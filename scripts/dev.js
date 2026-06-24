// Dev runner: starts the API server and the Vite dev server together.
//
// Zero dependencies (Node built-ins only), to match the rest of this project.
// Each child's output is line-prefixed so you can tell them apart, and both are
// shut down together on Ctrl+C or if either one exits.

import { spawn } from 'node:child_process';

// On Windows, `npm`/`vite` are .cmd shims that must be run through the shell.
const SHELL = process.platform === 'win32';

const procs = [
  { name: 'server', color: '\x1b[36m', cmd: 'node', args: ['server/index.js'] },
  { name: 'vite', color: '\x1b[35m', cmd: 'npx', args: ['vite'] },
];

const RESET = '\x1b[0m';
let shuttingDown = false;

/** Prefix every line of a child stream with a colored [name] tag. */
function pipePrefixed(stream, name, color) {
  let buf = '';
  stream.on('data', (chunk) => {
    buf += chunk.toString();
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      process.stdout.write(`${color}[${name}]${RESET} ${line}\n`);
    }
  });
}

const children = procs.map(({ name, color, cmd, args }) => {
  const child = spawn(cmd, args, {
    shell: SHELL,
    stdio: ['inherit', 'pipe', 'pipe'],
  });
  pipePrefixed(child.stdout, name, color);
  pipePrefixed(child.stderr, name, color);

  child.on('exit', (code) => {
    if (shuttingDown) return;
    process.stdout.write(`${color}[${name}]${RESET} exited (code ${code}). Shutting down.\n`);
    shutdown(code ?? 1);
  });
  return child;
});

/** Kill all children and exit. */
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
