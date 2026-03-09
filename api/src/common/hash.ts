import { keccak256, toBytes } from 'viem';

export function keccak256Utf8(input: string): `0x${string}` {
  return keccak256(toBytes(input));
}
