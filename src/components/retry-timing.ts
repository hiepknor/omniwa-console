export function retryCountdownSeconds(retryAt: number | undefined, now: number): number | undefined {
  return retryAt === undefined ? undefined : Math.max(0, Math.ceil((retryAt - now) / 1_000));
}

/** Schedule only the next countdown tick; no timer remains after the cooldown. */
export function nextCountdownDelay(retryAt: number | undefined, now: number): number | undefined {
  if (retryAt === undefined || retryAt <= now) return undefined;
  return Math.min(1_000, retryAt - now);
}

export function jitteredRetryDelay(random: number): number {
  return 250 + Math.floor(Math.min(1, Math.max(0, random)) * 750);
}
