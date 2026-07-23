import type { StatusTone } from './primitives';

export type SessionState = 'disconnected' | 'validating' | 'admin' | 'instance' | 'invalid';
export type CapabilityState = 'discovering' | 'supported' | 'unsupported' | 'legacy-compatible';
export type ProjectionState = 'not-started' | 'syncing' | 'ready' | 'stale' | 'failed';
export type ResourceState = 'initial-loading' | 'empty' | 'ready' | 'refreshing' | 'refresh-failed';
export type TransportState = 'online' | 'unreachable' | 'rate-limited' | 'authentication-failed';
export type CommandState = 'idle' | 'pending' | 'acknowledged' | 'uncertain' | 'failed';

export type UiState =
  | { axis: 'session'; state: SessionState }
  | { axis: 'capability'; state: CapabilityState }
  | { axis: 'projection'; state: ProjectionState }
  | { axis: 'resource'; state: ResourceState }
  | { axis: 'transport'; state: TransportState }
  | { axis: 'command'; state: CommandState };

export type UiStatePresentation = {
  label: string;
  title: string;
  tone: StatusTone;
  busy: boolean;
  blocking: boolean;
  retainsData: boolean;
};

const presentations = {
  session: {
    disconnected: ['Session', 'No active session', 'neutral', false, true, false],
    validating: ['Session', 'Validating credentials', 'pending', true, true, false],
    admin: ['Session', 'Admin scope active', 'healthy', false, false, true],
    instance: ['Session', 'Instance scope active', 'healthy', false, false, true],
    invalid: ['Session', 'Session is no longer valid', 'failed', false, true, false],
  },
  capability: {
    discovering: ['Capability', 'Discovering backend capabilities', 'pending', true, true, false],
    supported: ['Capability', 'Capability available', 'healthy', false, false, true],
    unsupported: ['Capability', 'Capability unavailable', 'neutral', false, true, false],
    'legacy-compatible': ['Capability', 'Using verified compatibility behavior', 'degraded', false, false, true],
  },
  projection: {
    'not-started': ['Projection', 'Projection has not started', 'neutral', false, true, false],
    syncing: ['Projection', 'Projection is synchronizing', 'pending', true, false, true],
    ready: ['Projection', 'Projection ready', 'healthy', false, false, true],
    stale: ['Projection', 'Projection data is stale', 'degraded', false, false, true],
    failed: ['Projection', 'Projection failed', 'failed', false, true, false],
  },
  resource: {
    'initial-loading': ['Resource', 'Loading resource', 'pending', true, true, false],
    empty: ['Resource', 'No records', 'neutral', false, false, false],
    ready: ['Resource', 'Resource ready', 'healthy', false, false, true],
    refreshing: ['Resource', 'Refreshing resource', 'pending', true, false, true],
    'refresh-failed': ['Resource', 'Refresh failed; showing previous data', 'degraded', false, false, true],
  },
  transport: {
    online: ['Transport', 'API reachable', 'healthy', false, false, true],
    unreachable: ['Transport', 'API unreachable', 'failed', false, true, false],
    'rate-limited': ['Transport', 'Operation rate limited', 'degraded', false, true, true],
    'authentication-failed': ['Transport', 'Authentication failed', 'failed', false, true, false],
  },
  command: {
    idle: ['Command', 'Ready to submit', 'neutral', false, false, false],
    pending: ['Command', 'Submitting command', 'pending', true, true, false],
    acknowledged: ['Command', 'Command acknowledged by the server', 'healthy', false, false, true],
    uncertain: ['Command', 'Command outcome is uncertain', 'degraded', false, true, false],
    failed: ['Command', 'Command failed', 'failed', false, true, false],
  },
} as const;

export function presentUiState(value: UiState): UiStatePresentation {
  let tuple: readonly [string, string, StatusTone, boolean, boolean, boolean];
  switch (value.axis) {
    case 'session': tuple = presentations.session[value.state]; break;
    case 'capability': tuple = presentations.capability[value.state]; break;
    case 'projection': tuple = presentations.projection[value.state]; break;
    case 'resource': tuple = presentations.resource[value.state]; break;
    case 'transport': tuple = presentations.transport[value.state]; break;
    case 'command': tuple = presentations.command[value.state]; break;
  }
  return { label: tuple[0], title: tuple[1], tone: tuple[2], busy: tuple[3], blocking: tuple[4], retainsData: tuple[5] };
}
