#!/usr/bin/env node
/* eslint-disable no-console */
const { spawnSync } = require('node:child_process');

function run(cmd, args, opts = {}) {
  return spawnSync(cmd, args, { stdio: 'inherit', ...opts });
}

try {
  // Check we're in a git repo
  const rev = spawnSync('git', ['rev-parse', '--git-dir'], { stdio: 'ignore' });
  if (rev.status !== 0) {
    // Not a git repo (e.g., CI artifact). Silently skip.
    process.exit(0);
  }

  // Point hooks to .githooks (portable, tracked)
  const cfg = run('git', ['config', 'core.hooksPath', '.githooks']);
  if (cfg.status === 0) {
    console.log('✔ hooks installed (core.hooksPath=.githooks)');
  } else {
    console.warn('⚠ could not set core.hooksPath to .githooks');
  }
} catch (e) {
  // Never fail installs due to hooks setup
  console.warn('⚠ hooks-install skipped:', e && e.message ? e.message : e);
}

