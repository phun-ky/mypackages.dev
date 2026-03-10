export const concurrentForEach = async <T>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
  options: { signal?: AbortSignal } = {}
) => {
  const { signal } = options;

  let i = 0;

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      if (signal?.aborted) return;

      const idx = i++;

      if (idx >= items.length) return;

      await fn(items[idx], idx);
    }
  });

  await Promise.all(workers);
};
