export function canonicalizeJson(input: unknown): string {
  // TODO (Milestone 1): Implement RFC 8785 JCS canonicalization
  // For now, we return JSON.stringify with stable key ordering.
  // This placeholder will be replaced in the next step.
  return JSON.stringify(sortKeysDeep(input));
}

function sortKeysDeep(value: any): any {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    const out: Record<string, any> = {};
    for (const key of Object.keys(value).sort()) {
      out[key] = sortKeysDeep(value[key]);
    }
    return out;
  }
  return value;
}
