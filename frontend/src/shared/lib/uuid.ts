/**
 * crypto.randomUUID() is only available in secure contexts (HTTPS / localhost).
 * When served over plain HTTP from a LAN IP, it throws. This utility falls back
 * to a Math.random-based v4 UUID so the app works on local network dev setups.
 */
export function randomUUID(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) {
    return c.randomUUID();
  }
  // RFC 4122 v4 UUID fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}
