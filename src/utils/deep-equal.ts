export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (a == null || b == null) return false;

  const aType = typeof a;
  const bType = typeof b;

  if (aType !== bType) return false;

  if (aType === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false;

    if (Array.isArray(a)) {
      if (a.length !== (b as unknown[]).length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqual(a[i], (b as unknown[])[i])) return false;
      }
      return true;
    }

    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) return false;

    for (const key of aKeys) {
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}
