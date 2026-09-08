let generation = 0;
let controller = new AbortController();

export function getSession() {
  return { generation, signal: controller.signal };
}

export function assertSession(expected: number): void {
  if (expected !== generation) throw new DOMException("Session ended", "AbortError");
}

export function invalidateSession(): void {
  const previous = controller;
  generation += 1;
  controller = new AbortController();
  previous.abort();
}
