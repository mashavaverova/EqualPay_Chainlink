import * as fs from 'node:fs';
import * as path from 'node:path';
import { canonicalizeJson } from '../common/canonicalize';
import { keccak256Utf8 } from '../common/hash';
import { computeScoreBps } from '../scoring/score';
import { getMethodologyId } from '../scoring/methodology';
import { validateReportOrThrow } from '../common/validateReport';

function main() {
  const file = path.join(process.cwd(), 'sample-report.v1.1.json');
  const raw = fs.readFileSync(file, 'utf8');
  const json = JSON.parse(raw);

  validateReportOrThrow(json);

  const canonical = canonicalizeJson(json);
  const hash = keccak256Utf8(canonical);

  console.log('Canonical JSON (first 200 chars):');
  console.log(canonical.slice(0, 200) + (canonical.length > 200 ? '...' : ''));
  console.log('\nreportHash:', hash);
  const score = computeScoreBps(json);
  console.log('\nscoreBps:', score.scoreBps);
  console.log('methodology:', score.methodology);
  console.log('meanBasePayPerFte_F:', score.meanBasePayPerFte_F);
  console.log('meanBasePayPerFte_M:', score.meanBasePayPerFte_M);
  console.log("methodologyId:", getMethodologyId());
}

main();
