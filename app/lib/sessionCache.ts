// lib/sessionCache.ts
export type BreathePayload = {
  title: string;
  prompts: string[]; // 4 prompts
  modelUsed?: string;
};

const cache: Record<string, BreathePayload> = {};

export function makeKey(input: { userState: string; dump: string; reflection: string }) {
  const s = `${input.userState}||${input.dump}||${input.reflection}`;
  // simple hash-ish key
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return String(h);
}

export function getBreathe(key: string) {
  return cache[key] || null;
}

export function setBreathe(key: string, value: BreathePayload) {
  cache[key] = value;
}
