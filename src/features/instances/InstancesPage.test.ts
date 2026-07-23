import { describe, expect, it } from 'vitest';
import { canManageInstances } from './InstancesPage';

describe('Instances command scope', () => {
  it('allows instance management only for an identified admin session', () => {
    expect(canManageInstances('admin')).toBe(true);
    expect(canManageInstances('api')).toBe(false);
    expect(canManageInstances('unknown')).toBe(false);
  });
});
