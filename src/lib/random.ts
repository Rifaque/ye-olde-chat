/**
 * Picks one item from the pool, avoiding the previous pick whenever the pool
 * offers any alternative. `random` is injectable so the choice can be tested.
 */
export function pickRandom<T extends { id: string }>(
  pool: readonly T[],
  previousId: string | null = null,
  random: () => number = Math.random,
): T | undefined {
  const candidates = pool.length > 1 ? pool.filter((item) => item.id !== previousId) : pool;
  const index = Math.min(Math.floor(random() * candidates.length), candidates.length - 1);
  return candidates[index];
}
