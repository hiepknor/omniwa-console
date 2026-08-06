import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { relativeTime } from '@/lib/format';
import { IconButton, MetricGrid, Panel, StateNotice } from '@/ui';
import { useCredentialHealth } from './hooks';
import { FailureNotice } from './ui';

export function CredentialHealth() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const supported = capabilities.data?.capabilities.includes('instance_credential_health') ?? false;
  const query = useCredentialHealth(session.keyKind === 'admin' && supported);
  const incomplete = query.data ? [
    query.data.currentKeyVersion,
    query.data.instances.total,
    query.data.instances.currentDigest,
    query.data.instances.plaintextOnly,
    query.data.instances.otherKeyVersion,
    query.data.plaintextFallback.lookups,
    query.data.plaintextFallback.affectedInstances,
  ].some((value) => value === undefined) : false;
  const metric = (value: number | undefined) => value === undefined ? '—' : String(value);
  if (session.keyKind !== 'admin') return null;
  return (
    <Panel
      title="Credential health"
      description="C3 observation facts only; Console never derives safeToRemove."
      actions={supported ? <IconButton icon="refresh" label="Refresh credential health" onClick={() => query.refetch()} busy={query.isFetching} /> : undefined}
      bodyPadding={query.data ? 'none' : 'default'}
    >
      {capabilities.isPending ? (
        <StateNotice kind="loading" title="Discovering capabilities" />
      ) : capabilities.isError && !capabilities.data ? (
        <FailureNotice error={capabilities.error} onRetry={() => capabilities.refetch()} />
      ) : !supported ? (
        <StateNotice kind="empty" title="Unsupported" detail="The backend does not advertise instance_credential_health; no migration conclusion is available." />
      ) : query.isPending ? (
        <StateNotice kind="loading" title="Reading credential-health facts" />
      ) : !query.data && query.isError ? (
        <FailureNotice error={query.error} onRetry={() => query.refetch()} />
      ) : query.data ? (
        <div>
          {query.isError ? <div className="p-4"><FailureNotice error={query.error} stale onRetry={() => query.refetch()} /></div> : null}
          {incomplete ? <div className="p-4"><StateNotice kind="info" title="Incomplete credential-health report" detail="Missing facts remain unreported; zero is shown only when the backend explicitly reports zero." /></div> : null}
          <MetricGrid
            columns={4}
            frame={query.isError || incomplete ? 'flush-after-content' : 'flush'}
            metrics={[
              { label: 'Key version', value: metric(query.data.currentKeyVersion) },
              { label: 'Instances', value: metric(query.data.instances.total) },
              { label: 'Current digest', value: metric(query.data.instances.currentDigest) },
              { label: 'Plaintext only', value: metric(query.data.instances.plaintextOnly) },
              { label: 'Other key version', value: metric(query.data.instances.otherKeyVersion) },
              { label: 'Fallback lookups', value: metric(query.data.plaintextFallback.lookups) },
              { label: 'Affected instances', value: metric(query.data.plaintextFallback.affectedInstances) },
              { label: 'Last fallback', value: query.data.plaintextFallback.lastObservedAt ? (relativeTime(query.data.plaintextFallback.lastObservedAt) || 'Not reported') : 'Not reported' },
            ]}
          />
          {query.data.instances.total === 0 ? <div className="p-4"><StateNotice kind="empty" title="Zero instances" detail="Zero instances is a 0/0 baseline, not adoption evidence." /></div> : null}
          <p className="p-3 text-xs text-fg-3">Generated {query.data.generatedAt ? (relativeTime(query.data.generatedAt) || 'at an unreported time') : 'at an unreported time'}.</p>
        </div>
      ) : null}
    </Panel>
  );
}
