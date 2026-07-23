import { hasCapability } from '@/api/capabilities';
import { useApiSession } from '@/api/ApiProvider';
import { useServerCapabilities } from '@/api/CapabilitiesProvider';
import { InlineError } from '@/components/InlineError';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { useInstanceCredentialHealth } from './hooks';

function Fact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="min-w-0 rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[color-mix(in_oklab,var(--fg)_2%,transparent)] p-3">
      <dt className="text-[10px] font-medium uppercase tracking-[0.6px] text-[var(--muted)]">{label}</dt>
      <dd className="num mt-1 break-words text-sm text-[var(--fg)]">{value}</dd>
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
    content = <div className="py-4 text-sm text-[var(--muted)]" role="status">Checking credential-health capability…</div>;
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
    content = <div className="py-4 text-sm text-[var(--muted)]" role="status">Loading credential health…</div>;
  } else if (query.isError) {
    content = <InlineError error={query.error} onRetry={query.refetch} />;
  } else {
    const health = query.data;
    const representative = health.instances.total > 0;
    content = (
      <div className="grid gap-3">
        <dl className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
          <Fact label="Key version" value={health.currentKeyVersion} />
          <Fact label="Instances" value={health.instances.total} />
          <Fact label="Current digest" value={health.instances.currentDigest} />
          <Fact label="Plaintext only" value={health.instances.plaintextOnly} />
          <Fact label="Other key version" value={health.instances.otherKeyVersion} />
          <Fact label="Fallback lookups" value={health.plaintextFallback.lookups} />
          <Fact label="Affected instances" value={health.plaintextFallback.affectedInstances} />
          <Fact label="Last fallback" value={health.plaintextFallback.lastObservedAt ?? 'Never observed'} />
        </dl>
        {!representative && (
          <SurfaceNotice
            kind="warning"
            label="Observation"
            title="No representative workload"
            detail="Zero instances is a 0/0 baseline, not adoption evidence. Do not start the credential quiet window from this snapshot."
          />
        )}
        <p className="text-xs leading-5 text-[var(--muted)]">
          Generated <span className="mono">{health.generatedAt ?? '—'}</span>. These are factual migration signals only; Console never derives a safe-to-remove decision.
        </p>
      </div>
    );
  }

  return (
    <section className="mb-4 grid gap-3 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--surface)] p-4" aria-labelledby="credential-health-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="eyebrow">C3 observation</span>
          <h2 id="credential-health-title" className="mt-1 text-base font-semibold text-[var(--fg)]">Credential Health</h2>
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
