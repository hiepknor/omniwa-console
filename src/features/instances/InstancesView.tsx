import type { ReactNode } from 'react';
import type { InstanceResource } from '@/api/instances';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Button, Field, Input, Panel, PageHeader, Select, StateNotice, Status, Table, Td, Th, Tr } from '@/ui';

export type InstancesViewProps = {
  search: string;
  status: string;
  onSearch: (value: string) => void;
  onStatus: (value: string) => void;
  onRefresh: () => void;
  refreshing: boolean;
  onNew: () => void;
  instances: InstanceResource[];
  totalLoaded: number;
  selectedId?: string;
  onOpen: (id: string) => void;
  initialLoading?: boolean;
  error?: ReactNode;
  emptyAll?: boolean;
  emptyFiltered?: boolean;
  credentialHealth?: ReactNode;
};

export function InstancesView(props: InstancesViewProps) {
  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Platform"
        title="Instances"
        description="Secret-free fleet metadata with explicit instance-scoped credential attachment."
        actions={
          <>
            <Button onClick={props.onRefresh} disabled={props.refreshing} aria-busy={props.refreshing || undefined}>
              {props.refreshing ? 'Refreshing…' : 'Refresh'}
            </Button>
            <Button variant="primary" onClick={props.onNew}>New instance</Button>
          </>
        }
      />

      {props.credentialHealth}

      <Panel
        title="Fleet metadata"
        description="List and detail use /instance/metadata only; tokens never enter view models or query keys."
        bodyClassName="p-0"
      >
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 p-4 border-b border-line max-sm:grid-cols-1">
          <Field label="Search">
            {(id) => (
              <Input
                id={id}
                type="search"
                value={props.search}
                placeholder="Name or instance ID"
                onChange={(e) => props.onSearch(e.target.value)}
              />
            )}
          </Field>
          <Field label="Status">
            {(id, labelId) => (
              <Select id={id} aria-labelledby={labelId} value={props.status} onValueChange={props.onStatus}>
                <option value="">All statuses</option>
                <option value="connected">Connected</option>
                <option value="disconnected">Disconnected</option>
              </Select>
            )}
          </Field>
        </div>

        {props.initialLoading ? (
          <div className="p-4"><StateNotice kind="loading" title="Loading instance metadata" detail="Reading instance metadata." /></div>
        ) : null}
        {props.error ? <div className="p-4">{props.error}</div> : null}
        {props.emptyAll ? (
          <div className="p-4"><StateNotice kind="empty" title="No instances" detail="The authoritative metadata list contains no instances." /></div>
        ) : null}
        {props.emptyFiltered ? (
          <div className="p-4"><StateNotice kind="empty" title="No match" detail="No loaded instance matches the URL-backed filters." /></div>
        ) : null}

        {props.instances.length > 0 ? (
          <Table className="border-0">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Instance ID</Th>
                <Th>Status</Th>
                <Th>Credential</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {props.instances.map((i) => (
                <Tr key={i.id} selected={i.id === props.selectedId} onClick={() => props.onOpen(i.id)}>
                  <Td className="font-medium">{i.displayName ?? 'Unnamed instance'}</Td>
                  <Td className="font-mono text-xs text-fg-2">{i.id}</Td>
                  <Td><Status tone={i.connected ? 'ok' : 'failed'}>{humanizeToken(i.status)}</Status></Td>
                  <Td className="font-mono text-xs text-fg-2">{i.credentialVersion ? `v${i.credentialVersion}` : 'Not reported'}</Td>
                  <Td className="text-fg-2" title={i.createdAt}>{relativeTime(i.createdAt) || 'Not reported'}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        ) : null}

        <p className="p-3 text-xs text-fg-3">
          {props.instances.length} of {props.totalLoaded} loaded instances. Polling every 15 seconds while this route is open.
        </p>
      </Panel>
    </div>
  );
}
