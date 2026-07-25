import { describe, expect, it } from 'vitest';
import { resolveUiGeneration } from './ui-generation';

describe('resolveUiGeneration', () => {
  it('enables v2 only for the explicit v2 value', () => {
    expect(resolveUiGeneration('v2')).toBe('v2');
  });

  it.each([undefined, '', 'legacy', 'V2', 'true'])('defaults %s to legacy', (value) => {
    expect(resolveUiGeneration(value)).toBe('legacy');
  });
});
