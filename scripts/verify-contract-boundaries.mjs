#!/usr/bin/env node
/**
 * Verify src/ai/contracts/ import boundaries — Sprint A2
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(process.cwd(), 'src/ai/contracts');
const FORBIDDEN = [
  /from\s+['"]@\/ai\/(nlp|memory|planningEngine|memoryEngine|lifeEngine)/,
  /from\s+['"].*planningEngine/,
  /from\s+['"].*memoryEngine/,
];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (name.endsWith('.ts') && !name.endsWith('.test.ts')) {
      const src = readFileSync(p, 'utf8');
      for (const re of FORBIDDEN) {
        if (re.test(src)) {
          console.error(`Boundary violation in ${p}: ${re}`);
          process.exit(1);
        }
      }
    }
  }
}

walk(ROOT);
console.log('verify:contracts — OK');
