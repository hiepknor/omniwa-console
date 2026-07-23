export type UiGeneration = 'legacy' | 'v2';

export function resolveUiGeneration(value: string | undefined): UiGeneration {
  return value === 'v2' ? 'v2' : 'legacy';
}
