import { ApiFailure } from '@/api/envelopes';

export type CommandCooldown = {
  active: boolean;
  remainingSeconds: number;
};

export function commandCooldown(error: unknown, now = Date.now()): CommandCooldown {
  if (!(error instanceof ApiFailure) || error.category !== 'rate_limited' || error.retryAt === undefined) {
    return { active: false, remainingSeconds: 0 };
  }
  const remainingSeconds = Math.max(0, Math.ceil((error.retryAt - now) / 1_000));
  return { active: remainingSeconds > 0, remainingSeconds };
}

export function shouldPreserveCommandError(error: unknown, now = Date.now()): boolean {
  return commandCooldown(error, now).active;
}
