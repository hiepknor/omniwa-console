export type UiGeneration = 'legacy' | 'v2';

export function resolveUiGeneration(value: string | undefined): UiGeneration {
  return value === 'v2' ? 'v2' : 'legacy';
}

export const UI_GENERATION = resolveUiGeneration(import.meta.env.VITE_CONSOLE_UI_GENERATION);
