import { useState } from 'react';
import { InstancesView } from '@/features/instances/InstancesView';
import { Button, DescriptionItem, DescriptionList, Drawer, Field, Image, Input, Panel, Status, Switch } from '@/ui';
import { instancesFixture } from './preview-fixtures';

/** Dev-only: Instances table + an open workspace drawer, with sample data. */
export function PreviewInstances() {
  const [open, setOpen] = useState(true);
  const instance = instancesFixture[0];
  return (
    <div className="min-h-dvh bg-bg">
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
        selectedId={instance.id}
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

          <Panel title="Connection & pairing" description="Connected and paired are different server facts.">
            <div className="grid gap-3">
              <Image src="/ui-qr-sample.svg" alt="Sample QR code for the pairing preview" aspect="square" fit="contain" className="w-52 justify-self-start" imageClassName="bg-surface p-3" />
              <p className="text-xs text-fg-3">WhatsApp → Linked Devices → Link a Device. Pairing is complete only when status reports loggedIn.</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="primary">Restart pairing</Button>
                <Button>Reconnect</Button>
              </div>
            </div>
          </Panel>

          <Panel title="Advanced settings" description="Instance-scoped live configuration. Saving does not imply provider delivery.">
            <div className="grid gap-3">
              {['Always online', 'Read receipts', 'Reject calls'].map((s, i) => (
                <Switch key={s} className="border-b border-line last:border-b-0" label={s} defaultChecked={i === 0} />
              ))}
              <Field label="Call rejection message">{(id) => <Input id={id} defaultValue="Sorry, calls are not accepted." />}</Field>
              <Button>Save settings</Button>
            </div>
          </Panel>

          <Panel title="Destructive actions" description="Disconnect drops the live connection; logout unpairs; destroy permanently removes the instance.">
            <div className="flex flex-wrap gap-2">
              <Button variant="danger">Disconnect…</Button>
              <Button variant="danger">Log out…</Button>
              <Button variant="danger">Destroy…</Button>
            </div>
          </Panel>
        </div>
      </Drawer>
    </div>
  );
}
