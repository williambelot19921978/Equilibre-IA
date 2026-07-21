/**
 * Sprint A2 — import boundary checks for src/ai/contracts/
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const CONTRACTS_ROOT = join(process.cwd(), 'src/ai/contracts');

function listTsFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      files.push(...listTsFiles(full));
    } else if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) {
      files.push(full);
    }
  }
  return files;
}

const LEGACY_IMPORT_PATTERN = /from\s+['"]@\/ai\/(?!contracts)/;
const FORBIDDEN_LEGACY = /from\s+['"].*\/(planningEngine|memoryEngine|lifeEngine|actionResolver)/;

describe('Sprint A2 — contract import boundaries', () => {
  const files = listTsFiles(CONTRACTS_ROOT);

  it('contract layer does not import legacy ai implementations', () => {
    const violations: string[] = [];
    for (const file of files) {
      const content = readFileSync(file, 'utf8');
      if (FORBIDDEN_LEGACY.test(content) || LEGACY_IMPORT_PATTERN.test(content)) {
        violations.push(relative(process.cwd(), file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('outcome observation contract forbids direct ULE write in invariants', () => {
    const content = readFileSync(
      join(CONTRACTS_ROOT, 'engines/outcome-observation-engine.contract.ts'),
      'utf8',
    );
    expect(content).toMatch(/Never writes UniversalLearningEngine directly/);
  });

  it('universal learning contract requires gate-passed input', () => {
    const content = readFileSync(
      join(CONTRACTS_ROOT, 'engines/universal-learning-engine.contract.ts'),
      'utf8',
    );
    expect(content).toMatch(/UniversalLearningInput/);
    expect(content).toMatch(/GatePassedUniversalSignal/);
  });
});
