export function parseFirestoreDate(val: unknown): Date | undefined {
  if (!val) return undefined;

  if (
    typeof val === 'object' &&
    val !== null &&
    'toDate' in val &&
    typeof (val as Record<string, unknown>).toDate === 'function'
  ) {
    return (val as { toDate: () => Date }).toDate();
  }

  if (val instanceof Date) {
    return val;
  }

  return undefined;
}
