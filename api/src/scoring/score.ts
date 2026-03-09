type Gender = 'F' | 'M' | 'X';

type Group = {
  level: 'Entry' | 'Intermediate' | 'Senior' | 'Lead' | 'Manager' | 'Executive';
  gender: Gender;
  nHeadcount: number;
  fteBps: number; // 1.0 FTE = 10000
  sumBasePay: string; // digits
  sumBonusPay?: string;
  sumHours?: number;
};

export type EqualPayReportV11 = {
  schemaVersion: '1.1';
  currency: string;
  population: 'employees';
  levelScheme: 'GLOBAL_6_BAND';
  company: { legalName: string; country: string; companyId: string };
  period: { start: string; end: string };
  groups: Group[];
  notes: {
    payPeriod: 'annual';
    basePayDefinition: 'gross_base_pay';
    includesBonus: boolean;
    includesEquity: boolean;
  };
  privacy: { minCellHeadcount: number };
};

export type ScoreResult = {
  methodology: 'mean_gap_v1_fte';
  scoreBps: number; // can be negative
  meanBasePayPerFte_F: string; // decimal string (for debugging / research)
  meanBasePayPerFte_M: string; // decimal string
};

function toBigIntDigits(x: string): bigint {
  if (!/^\d+$/.test(x)) throw new Error(`Expected digits string, got: ${x}`);
  return BigInt(x);
}

/**
 * Computes mean base pay gap using FTE normalization:
 * meanF = totalBasePayF / totalFteF
 * meanM = totalBasePayM / totalFteM
 * gap = 1 - (meanF/meanM)
 * scoreBps = gap * 10_000
 */
export function computeScoreBps(report: EqualPayReportV11): ScoreResult {
  let sumBaseF = 0n;
  let sumBaseM = 0n;
  let fteF_bps = 0n;
  let fteM_bps = 0n;

  for (const g of report.groups) {
    // Respect privacy rule by ignoring too-small cells (they should ideally be omitted upstream)
    if (g.nHeadcount < report.privacy.minCellHeadcount) continue;

    const fte = BigInt(g.fteBps);
    const base = toBigIntDigits(g.sumBasePay);

    if (g.gender === 'F') {
      sumBaseF += base;
      fteF_bps += fte;
    } else if (g.gender === 'M') {
      sumBaseM += base;
      fteM_bps += fte;
    }
  }

  if (fteF_bps === 0n || fteM_bps === 0n) {
    throw new Error('Insufficient FTE in F or M groups to compute score');
  }

  // Compare meanF/meanM without floating point:
  // meanF = sumBaseF / (fteF_bps/10000) = sumBaseF*10000 / fteF_bps
  // meanM = sumBaseM*10000 / fteM_bps
  // ratio = meanF/meanM = (sumBaseF*10000 / fteF_bps) / (sumBaseM*10000 / fteM_bps)
  //       = (sumBaseF * fteM_bps) / (sumBaseM * fteF_bps)
  const numerator = sumBaseF * fteM_bps;
  const denominator = sumBaseM * fteF_bps;

  if (denominator === 0n) throw new Error('Invalid denominator');

  // gap = 1 - ratio
  // scoreBps = (1 - ratio) * 10_000 = (den - num)/den * 10_000
  const diff = denominator - numerator;

  // integer bps with rounding to nearest:
  // scoreBps = diff * 10000 / denominator (rounded)
  const scaled = diff * 10000n;
  const half = denominator / 2n;
  const rounded =
    scaled >= 0n
      ? (scaled + half) / denominator
      : (scaled - half) / denominator;

  // debug means as decimal strings (rounded to 2 decimals)
  const meanF_x100 = (sumBaseF * 10000n * 100n + fteF_bps / 2n) / fteF_bps; // meanF *100
  const meanM_x100 = (sumBaseM * 10000n * 100n + fteM_bps / 2n) / fteM_bps; // meanM *100

  const meanF_str = `${meanF_x100 / 100n}.${String(meanF_x100 % 100n).padStart(2, '0')}`;
  const meanM_str = `${meanM_x100 / 100n}.${String(meanM_x100 % 100n).padStart(2, '0')}`;

  return {
    methodology: 'mean_gap_v1_fte',
    scoreBps: Number(rounded),
    meanBasePayPerFte_F: meanF_str,
    meanBasePayPerFte_M: meanM_str,
  };
}
