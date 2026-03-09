import { keccak256Utf8 } from '../common/hash';

export const METHODOLOGY_NAME = 'mean_gap_v1_fte' as const;

export function getMethodologyId(): `0x${string}` {
  return keccak256Utf8(METHODOLOGY_NAME);
}
