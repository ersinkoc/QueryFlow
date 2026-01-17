export class Dedup<K, V> {
  private pending = new Map<K, Promise<V>>();

  async dedupe(key: K, fn: () => Promise<V>): Promise<V> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fn();
    this.pending.set(key, promise);

    try {
      return await promise;
    } finally {
      this.pending.delete(key);
    }
  }

  clear(): void {
    this.pending.clear();
  }

  size(): number {
    return this.pending.size;
  }
}
