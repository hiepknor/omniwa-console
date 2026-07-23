import { useState } from 'react';
import { Button, Dialog, Field, Inspector, PageHeader, ScopeSelector, StateNotice, Status, Surface, Tabs, UiV2Boundary } from '@/components/v2';

const statuses = [
  ['healthy', 'Connected'],
  ['pending', 'Syncing'],
  ['degraded', 'Rate limited'],
  ['failed', 'Failed'],
  ['neutral', 'Not reported'],
] as const;

export function UiV2Gallery() {
  const [tab, setTab] = useState('ready');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  return (
    <UiV2Boundary className="ui-v2-gallery">
      <main className="ui-v2-gallery__main">
        <PageHeader
          eyebrow="Production component gallery"
          title="OmniWA Console v2 foundation"
          description="Contract-driven primitives rendered by the application, not a parallel static prototype."
          actions={<><Button>Refresh</Button><Button variant="primary">Primary action</Button></>}
        />

        <div className="ui-v2-gallery__grid">
          <Surface title="Actions" description="One primary action per view; destructive intent remains explicit.">
            <div className="ui-v2-cluster"><Button variant="primary">Continue</Button><Button>Cancel</Button><Button variant="danger">Discard…</Button><Button disabled>Unavailable</Button></div>
          </Surface>

          <Surface title="Operational status" description="Every semantic color is paired with text.">
            <div className="ui-v2-status-list">{statuses.map(([tone, label]) => <Status key={tone} tone={tone}>{label}</Status>)}</div>
          </Surface>

          <Surface title="Form controls" description="Labels, hints and errors remain programmatically associated.">
            <div className="ui-v2-form-grid">
              <Field label="API origin" defaultValue="https://staging-api.onio.cc" hint="Origin only; no path or credential." />
              <Field label="Instance ID" defaultValue="314a151c-5e40-4b0a-9268-4c3087e936e7" error="Example validation state" />
            </div>
          </Surface>

          <Surface title="Resource list" description="Dense rows stay tabular; compact views expose the same identity and state.">
            <div className="ui-v2-table-wrap" tabIndex={0} aria-label="Scrollable instance table">
              <table className="ui-v2-table">
                <caption className="ui-v2-visually-hidden">Instance foundation example</caption>
                <thead><tr><th>Name</th><th>Instance ID</th><th>Status</th><th>Updated</th></tr></thead>
                <tbody>
                  <tr><td data-label="Name">support-vn</td><td data-label="Instance ID" className="ui-v2-mono">314a151c…</td><td data-label="Status"><Status tone="healthy">Connected</Status></td><td data-label="Updated" title="2026-07-23T10:19:08Z">2m ago</td></tr>
                  <tr><td data-label="Name">legacy-bot</td><td data-label="Instance ID" className="ui-v2-mono">0aa41m…</td><td data-label="Status"><Status tone="failed">Disconnected</Status></td><td data-label="Updated" title="2026-07-22T10:19:08Z">1d ago</td></tr>
                </tbody>
              </table>
            </div>
          </Surface>

          <Surface title="Independent state axes" description="Projection, resource and command facts stay distinct.">
            <div className="ui-v2-state-list">
              <StateNotice value={{ axis: 'projection', state: 'stale' }} detail="Showing the last usable projection snapshot from 12 minutes ago." action={<Button>Retry</Button>} />
              <StateNotice value={{ axis: 'resource', state: 'refresh-failed' }} detail="The existing rows remain available." requestId="req_01JZ" />
              <StateNotice value={{ axis: 'command', state: 'acknowledged' }} detail="Acknowledgement does not prove WhatsApp delivery." />
            </div>
          </Surface>

          <Surface title="Context and overlays" description="Scope, tabs, dialogs and inspectors share keyboard contracts.">
            <div className="ui-v2-stack">
              <ScopeSelector defaultValue="admin"><option value="admin">Platform · admin</option><option value="instance">support-vn · instance</option></ScopeSelector>
              <Tabs label="Foundation states" selectedId={tab} onSelect={setTab} items={[{ id: 'ready', label: 'Ready', count: 12 }, { id: 'syncing', label: 'Syncing', count: 2 }, { id: 'failed', label: 'Failed', count: 1 }]} />
              <div className="ui-v2-tab-panel" role="tabpanel" id={`${tab}-panel`} aria-labelledby={`${tab}-tab`}>Selected state: {tab}</div>
              <div className="ui-v2-cluster"><Button onClick={() => setInspectorOpen(true)}>Open inspector</Button><Button onClick={() => setDialogOpen(true)}>Open dialog</Button></div>
            </div>
          </Surface>
        </div>
      </main>
      {inspectorOpen ? <Inspector titleId="gallery-inspector" eyebrow="Instance" title="support-vn" status={<Status tone="healthy">Connected</Status>} subtitle={<span className="ui-v2-mono">314a151c…</span>} modal onClose={() => setInspectorOpen(false)}><StateNotice value={{ axis: 'capability', state: 'supported' }} detail="Instance metadata views are available." /></Inspector> : null}
      {dialogOpen ? <Dialog titleId="gallery-dialog" title="Submit command?" description="This example demonstrates focus ownership and acknowledgement-safe action copy." onClose={() => setDialogOpen(false)} actions={<><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => setDialogOpen(false)}>Submit command</Button></>}><Field label="Operator reason" defaultValue="Manual recovery" /></Dialog> : null}
    </UiV2Boundary>
  );
}
