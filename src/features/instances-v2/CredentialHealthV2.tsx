import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { Button, StateNotice, Surface } from '@/components/v2';
import { relativeTime } from '@/lib/format';
import { useCredentialHealthV2 } from './hooks';
import { FailureNotice } from './ui';

export function CredentialHealthV2() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const supported = capabilities.data?.capabilities.includes('instance_credential_health') ?? false;
  const query = useCredentialHealthV2(session.keyKind === 'admin' && supported);
  if (session.keyKind !== 'admin') return null;
  return (
    <Surface title="Credential health" description="C3 observation facts only; Console never derives safeToRemove."
      actions={supported ? <Button onClick={() => query.refetch()} disabled={query.isFetching}>{query.isFetching ? 'Refreshing…' : 'Refresh health'}</Button> : undefined}>
      {capabilities.isPending ? <StateNotice value={{ axis: 'capability', state: 'discovering' }} />
        : capabilities.isError ? <FailureNotice error={capabilities.error} onRetry={() => capabilities.refetch()} />
        : !supported ? <StateNotice value={{ axis: 'capability', state: 'unsupported' }} detail="The backend does not advertise instance_credential_health; no migration conclusion is available." />
        : query.isPending ? <StateNotice value={{ axis: 'resource', state: 'initial-loading' }} detail="Reading credential-health facts." />
        : !query.data && query.isError ? <FailureNotice error={query.error} onRetry={() => query.refetch()} />
        : query.data ? <>
          {query.isError ? <FailureNotice error={query.error} stale onRetry={() => query.refetch()} /> : null}
          <div className="ui-v2-metric-grid ui-v2-credential-grid">
            {[
              ['Key version', query.data.currentKeyVersion], ['Instances', query.data.instances.total],
              ['Current digest', query.data.instances.currentDigest], ['Plaintext only', query.data.instances.plaintextOnly],
              ['Other key version', query.data.instances.otherKeyVersion], ['Fallback lookups', query.data.plaintextFallback.lookups],
              ['Affected instances', query.data.plaintextFallback.affectedInstances],
              ['Last fallback', query.data.plaintextFallback.lastObservedAt ? relativeTime(query.data.plaintextFallback.lastObservedAt) : 'Never observed'],
            ].map(([label, value]) => <div key={label as string}><span>{label}</span><strong>{value}</strong></div>)}
          </div>
          {query.data.instances.total === 0 ? <StateNotice value={{ axis: 'resource', state: 'empty' }} detail="Zero instances is a 0/0 baseline, not adoption evidence. Do not start the credential quiet window from this snapshot." /> : null}
          <p className="ui-v2-generated-note">Generated {query.data.generatedAt ? relativeTime(query.data.generatedAt) : 'at an unreported time'}.</p>
        </> : null}
    </Surface>
  );
}
