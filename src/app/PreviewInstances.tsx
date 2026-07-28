import { useState } from 'react';
import { ConnectionAndPairing, type InstancePairingController } from '@/features/instances/ConnectionAndPairing';
import { InstancesView } from '@/features/instances/InstancesView';
import { Button, DescriptionItem, DescriptionList, Drawer, Field, Input, Panel, Status, Switch } from '@/ui';
import { instancesFixture } from './preview-fixtures';

/** Dev-only: Instances table + an open workspace drawer, with sample data. */
export function PreviewInstances() {
  const [open, setOpen] = useState(true);
  const instance = instancesFixture[0];
  const pairingController = {
    commandError: null,
    commandPending: false,
    commandReady: true,
    connected: true,
    lastAcknowledgement: undefined,
    loggedIn: true,
    pairing: false,
    qr: { data: undefined, error: null, refetch: async () => undefined },
    reconnectSession: () => {},
    startPairing: () => {},
    status: { data: { connected: true, loggedIn: true }, error: null, isError: false, isPending: false, refetch: async () => undefined },
    statusReady: true,
  } as unknown as InstancePairingController;
  return (
    <main className="min-h-dvh bg-bg">
      <InstancesView
        search=""
        status=""
        onSearch={() => {}}
        onStatus={() => {}}
        onRefresh={() => {}}
        refreshing={false}
        onNew={() => {}}
        instances={instancesFixture}
        totalLoaded={instancesFixture.length}
        selectedId={open ? instance.id : undefined}
        onOpen={() => setOpen(true)}
      />

      <Drawer open={open} onClose={() => setOpen(false)} title={instance.displayName ?? 'Unnamed instance'} subtitle={instance.id}>
        <div className="grid gap-4">
          <Status tone="ok">Paired</Status>

          <Panel title="Instance facts" description="Admin metadata and instance-scoped status remain separate." bodyPadding="compact-top">
            <DescriptionList>
              <DescriptionItem label="Metadata status">Connected</DescriptionItem>
              <DescriptionItem label="Live connection">Connected</DescriptionItem>
              <DescriptionItem label="Paired">Yes</DescriptionItem>
              <DescriptionItem label="WhatsApp ID" mono>{instance.jid ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Credential version">{String(instance.credentialVersion)}</DescriptionItem>
              <DescriptionItem label="Created">12 days ago</DescriptionItem>
            </DescriptionList>
          </Panel>

          <ConnectionAndPairing controller={pairingController} />

          <Panel title="Advanced settings" description="Instance-scoped live configuration. Saving does not imply provider delivery.">
            <div className="grid gap-3">
              {['Always online', 'Read receipts', 'Reject calls'].map((s, i) => (
                <Switch key={s} className="border-b border-line last:border-b-0" label={s} defaultChecked={i === 0} />
              ))}
              <Field label="Call rejection message">{(id) => <Input id={id} defaultValue="Sorry, calls are not accepted." />}</Field>
              <Button>Save settings</Button>
            </div>
          </Panel>

          <Panel title="Destructive actions" description="Disconnect drops the live connection; Log out WhatsApp unpairs; destroy permanently removes the instance.">
            <div className="flex flex-wrap gap-2">
              <Button variant="danger">Disconnect…</Button>
              <Button variant="danger">Log out WhatsApp…</Button>
              <Button variant="danger">Destroy…</Button>
            </div>
          </Panel>
        </div>
      </Drawer>
    </main>
  );
}
