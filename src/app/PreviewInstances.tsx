import { useState } from 'react';
import { InstancesView } from '@/features/instances/InstancesView';
import { Button, Drawer, Field, Input, Panel, Status } from '@/ui';
import { instancesFixture } from './preview-fixtures';

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-line last:border-b-0">
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-fg' : 'text-[13px] text-fg'}>{value}</dd>
    </div>
  );
}

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

          <Panel title="Instance facts" description="Admin metadata and instance-scoped status remain separate." bodyClassName="pt-2">
            <dl>
              <Fact label="Metadata status" value="Connected" />
              <Fact label="Live connection" value="Connected" />
              <Fact label="Paired" value="Yes" />
              <Fact label="WhatsApp ID" value={instance.jid ?? 'Not reported'} mono />
              <Fact label="Credential version" value={String(instance.credentialVersion)} />
              <Fact label="Created" value="12 days ago" />
            </dl>
          </Panel>

          <Panel title="Connection and pairing" description="Connected and paired are different server facts.">
            <div className="grid gap-3">
              <div className="justify-self-start bg-white p-3 border border-line-strong">
                <div className="size-52 bg-[repeating-conic-gradient(#111_0_25%,#fff_0_50%)] bg-[length:16px_16px]" aria-hidden />
              </div>
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
                <label key={s} className="flex items-start justify-between gap-4 py-2 border-b border-line last:border-b-0">
                  <span className="grid gap-0.5"><strong className="text-[13px] font-medium text-fg">{s}</strong></span>
                  <input type="checkbox" defaultChecked={i === 0} className="mt-1 size-4 accent-fg" />
                </label>
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
