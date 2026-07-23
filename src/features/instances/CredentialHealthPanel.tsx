import { hasCapability } from '@/api/capabilities';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { InlineError } from '@/components/InlineError';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { relativeTime } from '@/lib/format';
import { useInstanceCredentialHealth } from './hooks';

function Fact({ label, value, title }: { label: string; value: string | number | undefined; title?: string }) {
  return (
    <div className="credential-health-fact">
      <dt>{label}</dt>
      <dd className="num" data-state={value === undefined ? 'unavailable' : 'reported'} title={title}>{value ?? 'Not reported'}</dd>
    </div>
  );
}

export function CredentialHealthPanel() {
  const session = useApiSession();
  const capabilities = useServerCapabilities();
  const supported = hasCapability(capabilities.data, 'instance_credential_health');
  const query = useInstanceCredentialHealth(session.keyKind === 'admin' && supported);

  if (session.keyKind !== 'admin') return null;

  let content;
  if (capabilities.isPending) {
    content = <div className="credential-health-loading" role="status">Checking credential-health capability…</div>;
  } else if (capabilities.isError) {
    content = <InlineError error={capabilities.error} onRetry={capabilities.refetch} />;
  } else if (!supported) {
    content = (
      <SurfaceNotice
        kind="warning"
        label="Capability"
        title="Credential health is not available"
        detail="This backend does not advertise instance_credential_health. No migration safety conclusion can be made."
      />
    );
  } else if (query.isPending) {
    content = <div className="credential-health-loading" role="status">Loading credential health…</div>;
  } else if (query.isError) {
    content = <InlineError error={query.error} onRetry={query.refetch} />;
  } else {
    const health = query.data;
    const representative = health.instances.total !== undefined && health.instances.total > 0;
    const fallbackLastObserved = health.plaintextFallback.lastObservedAt
      ? relativeTime(health.plaintextFallback.lastObservedAt) || health.plaintextFallback.lastObservedAt
      : health.plaintextFallback.lookups === 0 ? 'Never observed' : undefined;
    content = (
      <div className="credential-health-content">
        <dl className="credential-health-facts">
          <Fact label="Key version" value={health.currentKeyVersion} />
          <Fact label="Instances" value={health.instances.total} />
          <Fact label="Current digest" value={health.instances.currentDigest} />
          <Fact label="Plaintext only" value={health.instances.plaintextOnly} />
          <Fact label="Other key version" value={health.instances.otherKeyVersion} />
          <Fact label="Fallback lookups" value={health.plaintextFallback.lookups} />
          <Fact label="Affected instances" value={health.plaintextFallback.affectedInstances} />
          <Fact label="Last fallback" value={fallbackLastObserved} title={health.plaintextFallback.lastObservedAt} />
        </dl>
        {health.instances.total === 0 && (
          <SurfaceNotice
            kind="warning"
            label="Observation"
            title="No representative workload"
            detail="Zero instances is a 0/0 baseline, not adoption evidence. Do not start the credential quiet window from this snapshot."
          />
        )}
        {health.instances.total === undefined && (
          <SurfaceNotice
            kind="warning"
            label="Observation"
            title="Coverage is not reported"
            detail="The backend did not provide an instance total. No workload or migration-safety conclusion can be made from this snapshot."
          />
        )}
        {representative && health.plaintextFallback.lookups === undefined && (
          <SurfaceNotice
            kind="warning"
            label="Fallback"
            title="Fallback activity is not reported"
            detail="The instance workload exists, but fallback counters are unavailable. Continue observation without treating the missing value as zero."
          />
        )}
        <p className="credential-health-note">
          Generated <span className="mono" title={health.generatedAt}>{relativeTime(health.generatedAt) || 'Not reported'}</span>. These are factual migration signals only; Console never derives a safe-to-remove decision.
        </p>
      </div>
    );
  }

  return (
    <section className="credential-health-panel" aria-labelledby="credential-health-title">
      <header className="credential-health-head">
        <div>
          <span className="eyebrow">C3 observation</span>
          <h2 id="credential-health-title">Credential Health</h2>
        </div>
        {supported && (
          <button className="btn" type="button" disabled={query.isFetching} onClick={() => query.refetch()}>
            {query.isFetching ? 'Refreshing…' : 'Refresh health'}
          </button>
        )}
      </header>
      {content}
    </section>
  );
}
