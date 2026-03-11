/**
 * Given an array of scouting entries and a numeric field name,
 * returns a 0-100 reliability score (avg / max * 100).
 */
export function reliabilityScore(entries, field) {
  const vals = entries
    .map((e) => parseFloat(e[field]))
    .filter((v) => !isNaN(v) && v >= 0);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  const max = Math.max(...vals);
  return max > 0 ? Math.round((avg / max) * 100) : 0;
}

/** Returns the average of a numeric field across entries, or null. */
export function avgField(entries, field) {
  const vals = entries
    .map((e) => parseFloat(e[field]))
    .filter((v) => !isNaN(v));
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

/** Returns a colour string based on a 0-100 score. */
export function reliabilityColor(score) {
  if (score === null) return 'var(--muted)';
  if (score >= 75) return 'var(--accent)';
  if (score >= 50) return 'var(--warning)';
  return 'var(--danger)';
}
