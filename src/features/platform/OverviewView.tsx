import type { ReactNode } from 'react';
import type { OverviewResource, ProjectionHealthResource, ServerHealthResource } from '@/api/overview';
import { formatCount, humanizeToken, relativeTime } from '@/lib/format';
import { Button, ButtonLink, Field, FilterToolbar, MetricGrid, PageHeader, Panel, Select, StateNotice, Status, Table, Td, Th, Tr, type Tone } from '@/ui';

function projectionTone(status: string): Tone {
  if (status === 'healthy' || status === 'ready') return 'ok';
  if (status === 'failed') return 'failed';
  return 'degraded';
}

export type OverviewViewProps = {
  window: string;
  windowOptions: { value: string; label: string }[];
  onWindowChange: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  initialLoading: boolean;
  notices?: ReactNode;
  health?: ServerHealthResource;
  overview?: OverviewResource;
  projection?: ProjectionHealthResource;
  recovery: 'available' | 'pending' | 'unsupported' | 'error';
  credentialScope: 'admin' | 'instance' | 'unknown';
  authenticatedInstanceId?: string;
};

export function OverviewView(props: OverviewViewProps) {
  const { health, overview, projection } = props;
  const instanceScope = props.credentialScope === 'instance';
  const instanceId = props.authenticatedInstanceId
    ?? (overview?.scope.type === 'instance' ? overview.scope.instanceId : undefined);
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow={instanceScope ? 'Instance' : 'Platform'}
        title="Operational overview"
        description={instanceScope
          ? (
              <>
                Monitor connection, projection, throttling, and messaging health for the authenticated instance
                {instanceId ? <>{' '}<span className="font-mono [overflow-wrap:anywhere]">{instanceId}</span></> : null}.
              </>
            )
          : 'Monitor server, instance, projection, and messaging health.'}
        secondaryActions={<Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>{props.refreshing ? 'Refreshing…' : 'Refresh'}</Button>}
      />

      {props.notices}

      {props.initialLoading ? (
        <StateNotice
          kind="loading"
          title={instanceScope ? 'Loading instance snapshots' : 'Loading platform snapshots'}
          detail={`Reading persisted ${instanceScope ? 'instance' : 'platform'} snapshots.`}
        />
      ) : null}

      {health ? (
        <Panel
          title={instanceScope ? 'API and instance health' : 'Control plane and instance health'}
          description={instanceScope
            ? `Generated ${relativeTime(health.generatedAt) || 'at an unreported time'}. Transport, projection, and throttling remain independent; pairing status is reported on the Instance page.`
            : `Generated ${relativeTime(health.generatedAt) || 'at an unreported time'}. Connection, projection, and throttling remain independent.`}
          actions={<Status tone={health.api.status === 'healthy' ? 'ok' : 'degraded'}>{humanizeToken(health.api.status)}</Status>}
          bodyPadding="none"
        >
          {health.instances.length === 0 ? (
            <div className="p-4">
              <StateNotice kind="empty" title="No instances in snapshot" detail="The health snapshot contains no instances; this is not evidence of a representative workload." />
            </div>
          ) : (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Instance</Th>
                  <Th>{instanceScope ? 'Transport' : 'Connection'}</Th>
                  <Th>Projection</Th>
                  <Th>Throttling</Th>
                </tr>
              </thead>
              <tbody>
                {health.instances.map((i) => (
                  <Tr key={i.instanceId}>
                    <Td mobileLabel="Instance" className="font-mono text-xs text-fg-2">{i.instanceId}</Td>
                    <Td mobileLabel={instanceScope ? 'Transport' : 'Connection'}><Status tone={i.connection.connected === true ? 'ok' : i.connection.connected === false ? 'failed' : 'neutral'}>{humanizeToken(i.connection.status)}</Status></Td>
                    <Td mobileLabel="Projection"><Status tone={projectionTone(i.projection.status)}>{humanizeToken(i.projection.status)}</Status></Td>
                    <Td mobileLabel="Throttling"><Status tone={i.throttling.observed === true ? 'degraded' : 'neutral'}>{humanizeToken(i.throttling.status)}</Status></Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ) : null}

      {overview ? (
        <Panel
          title="Persisted metrics"
          description={`${humanizeToken(overview.scope.type)} scope · ${props.window} · generated ${relativeTime(overview.generatedAt) || 'at an unreported time'}`}
          bodyPadding="none"
        >
          <FilterToolbar aria-label="Metric controls">
            <Field label="Metric window" className="w-full max-w-48">{(id, labelId) => <Select id={id} aria-labelledby={labelId} value={props.window} onValueChange={props.onWindowChange}>{props.windowOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}</Field>
          </FilterToolbar>
          <MetricGrid
            columns={5}
            density="compact"
            frame="flush-after-content"
            metrics={[
              { label: instanceScope ? 'Instances in scope' : 'Instances', value: formatCount(overview.instances.total) },
              { label: 'Connected', value: formatCount(overview.instances.connected) },
              { label: 'Disconnected', value: formatCount(overview.instances.disconnected) },
              { label: 'Messages', value: formatCount(overview.messages.total) },
              { label: 'Incoming', value: formatCount(overview.messages.incoming) },
              { label: 'Outgoing', value: formatCount(overview.messages.outgoing) },
              { label: 'Chats', value: formatCount(overview.projections.chats) },
              { label: 'Groups', value: formatCount(overview.projections.groups) },
              { label: 'Contacts', value: formatCount(overview.projections.contacts) },
              { label: 'Events', value: formatCount(overview.projections.events) },
            ]}
          />
        </Panel>
      ) : null}

      {projection ? (
        <Panel
          title="Projection posture"
          description={`Aggregate snapshot generated ${relativeTime(projection.generatedAt) || 'at an unreported time'}.`}
          actions={<Status tone={projectionTone(projection.status)}>{humanizeToken(projection.status)}</Status>}
          bodyPadding="none"
        >
          {projection.resources.length === 0 ? (
            <div className="p-4">
              <StateNotice kind="empty" title="No projection resources" detail="The server reported no projection resources in this snapshot." />
            </div>
          ) : (
            <Table className="border-0">
              <thead>
                <tr>
                  <Th>Resource</Th>
                  <Th>Instance</Th>
                  <Th>Sync state</Th>
                  <Th className="text-right">Pending</Th>
                  <Th className="text-right">Dead letters</Th>
                  <Th className="text-right">Event lag</Th>
                </tr>
              </thead>
              <tbody>
                {projection.resources.map((r, index) => (
                  <Tr key={`${r.instanceId ?? 'server'}-${r.resource}-${index}`}>
                    <Td mobileLabel="Resource">{humanizeToken(r.resource)}</Td>
                    <Td mobileLabel="Instance" className="font-mono text-xs text-fg-2">{r.instanceId ?? 'Server'}</Td>
                    <Td mobileLabel="Sync state"><Status tone={r.syncStatus === 'ready' ? 'ok' : r.syncStatus === 'failed' ? 'failed' : 'degraded'}>{humanizeToken(r.syncStatus)}</Status></Td>
                    <Td mobileLabel="Pending" className="text-right font-mono tabular-nums">{formatCount(r.pendingEvents)}</Td>
                    <Td mobileLabel="Dead letters" className="text-right font-mono tabular-nums">{formatCount(r.deadLetterEvents)}</Td>
                    <Td mobileLabel="Event lag" className="text-right font-mono tabular-nums">{r.eventLagSeconds === undefined ? '—' : `${r.eventLagSeconds}s`}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Panel>
      ) : null}

      {props.credentialScope === 'admin' ? (
        <Panel title="Recovery" description="Terminal projection failures require an explicit audited operator command.">
          {props.recovery === 'pending' ? (
            <StateNotice kind="loading" title="Discovering capabilities" detail="Waiting for capability discovery before enabling Recovery." />
          ) : props.recovery === 'available' ? (
            <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
              <p className="text-sm text-fg-2">Review dead letters without inferring recovery from aggregate health.</p>
              <ButtonLink to="/recovery">Open recovery</ButtonLink>
            </div>
          ) : props.recovery === 'error' ? (
            <StateNotice kind="error" title="Recovery availability unknown" detail="Capability discovery failed. Retry the capability read before relying on Recovery availability." />
          ) : (
            <StateNotice kind="empty" title="Recovery unavailable" detail="Recovery requires admin scope and the projection_failure_operations capability." />
          )}
        </Panel>
      ) : null}
    </div>
  );
}
