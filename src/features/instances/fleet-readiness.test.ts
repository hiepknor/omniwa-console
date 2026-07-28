import { describe, expect, it } from 'vitest';
import { fleetReadMode } from './fleet-readiness';

describe('fleetReadMode', () => {
  it('waits for capability discovery before choosing a credential-safe endpoint', () => {
    expect(fleetReadMode({ keyKind: 'admin', capabilitiesPending: true, capabilitiesError: false, capabilitiesAvailable: false, metadataAvailable: false })).toBe('discovering');
  });

  it('uses metadata when advertised and the compatibility adapter otherwise', () => {
    expect(fleetReadMode({ keyKind: 'admin', capabilitiesPending: false, capabilitiesError: false, capabilitiesAvailable: true, metadataAvailable: true })).toBe('metadata');
    expect(fleetReadMode({ keyKind: 'admin', capabilitiesPending: false, capabilitiesError: false, capabilitiesAvailable: true, metadataAvailable: false })).toBe('compatibility');
  });

  it('never starts a fleet read for the wrong scope or failed discovery', () => {
    expect(fleetReadMode({ keyKind: 'api', capabilitiesPending: false, capabilitiesError: false, capabilitiesAvailable: true, metadataAvailable: true })).toBe('scope-blocked');
    expect(fleetReadMode({ keyKind: 'admin', capabilitiesPending: false, capabilitiesError: true, capabilitiesAvailable: false, metadataAvailable: false })).toBe('capability-error');
  });

  it('keeps read-only fleet data available from a cached capability snapshot', () => {
    expect(fleetReadMode({ keyKind: 'admin', capabilitiesPending: false, capabilitiesError: true, capabilitiesAvailable: true, metadataAvailable: true })).toBe('metadata');
  });
});
