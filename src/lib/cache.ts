type Entry<T> = { value: T; expires: number };

const store = new Map<string, Entry<unknown>>();

export function cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as Entry<T> | undefined;
  if (hit && hit.expires > Date.now()) {
    return Promise.resolve(hit.value);
  }
  return fn().then((value) => {
    store.set(key, { value, expires: Date.now() + ttlMs });
    return value;
  });
}
