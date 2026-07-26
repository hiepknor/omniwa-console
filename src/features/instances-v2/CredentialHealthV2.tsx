import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { relativeTime } from '@/lib/format';
import { Button, MetricGrid, Panel, StateNotice } from '@/ui';
import { useCredentialHealthV2 } from './hooks';
import { FailureNotice } from './ui';

export function CredentialHealthV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const supported = capabilities.data?.capabilities.includes('instance_credential_health') ?? false;
  const query = useCredentialHealthV2(session.keyKind === 'admin' && supported);
  if (session.keyKind !== 'admin') return null;
  return (
    <Panel
      title="Credential health"
      description="C3 observation facts only; Console never derives safeToRemove."
      actions={supported ? <Button onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? 'Refreshing…' : 'Refresh health'}</Button> : undefined}
      bodyClassName={query.data ? 'p-0' : undefined}
    >
      {capabilities.isPending ? (
        <StateNotice kind="loading" title="Discovering capabilities" />
      ) : capabilities.isError ? (
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
          <MetricGrid
            columns={4}
            className="border-t-0 border-l-0"
            metrics={[
              { label: 'Key version', value: String(query.data.currentKeyVersion) },
              { label: 'Instances', value: String(query.data.instances.total) },
              { label: 'Current digest', value: String(query.data.instances.currentDigest) },
              { label: 'Plaintext only', value: String(query.data.instances.plaintextOnly) },
              { label: 'Other key version', value: String(query.data.instances.otherKeyVersion) },
              { label: 'Fallback lookups', value: String(query.data.plaintextFallback.lookups) },
              { label: 'Affected instances', value: String(query.data.plaintextFallback.affectedInstances) },
              { label: 'Last fallback', value: query.data.plaintextFallback.lastObservedAt ? (relativeTime(query.data.plaintextFallback.lastObservedAt) || 'Not reported') : 'Never observed' },
            ]}
          />
          {query.data.instances.total === 0 ? <div className="p-4"><StateNotice kind="empty" title="Zero instances" detail="Zero instances is a 0/0 baseline, not adoption evidence." /></div> : null}
          <p className="p-3 text-xs text-fg-3">Generated {query.data.generatedAt ? (relativeTime(query.data.generatedAt) || 'at an unreported time') : 'at an unreported time'}.</p>
        </div>
      ) : null}
    </Panel>
  );
}
