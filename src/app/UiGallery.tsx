import { useState } from 'react';
import { FeedbackContent } from '@/components/feedback/FeedbackContent';
import {
  Badge,
  Button,
  ButtonLink,
  Checkbox,
  CloseButton,
  CursorPagination,
  DateTimeInput,
  DescriptionItem,
  DescriptionList,
  Dialog,
  Drawer,
  Field,
  FilterChip,
  FilterToolbar,
  Input,
  MetricGrid,
  PageHeader,
  Panel,
  Radio,
  Select,
  StateNotice,
  Status,
  Switch,
  Table,
  Tabs,
  Td,
  Th,
  Textarea,
  Tr,
  type Tone,
} from '@/ui';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid min-w-0 gap-4 py-8 border-b border-line">
      <h2 className="text-[11px] font-medium uppercase tracking-wider text-fg-3">{title}</h2>
      {children}
    </section>
  );
}

const tones: Tone[] = ['ok', 'pending', 'degraded', 'failed', 'info', 'neutral'];
const surfaces = [
  ['bg', '#ffffff'],
  ['surface', '#ffffff'],
  ['elevated', '#f2f2f2'],
  ['recessed', '#f6f6f6'],
  ['line', '#e2e2e2'],
  ['line-strong', '#111111'],
];
const inkRamp = [
  ['fg', '#111111'],
  ['fg-2', '#565656'],
  ['fg-3', '#6b6b6b'],
  ['line', '#e2e2e2'],
];

export function UiGallery() {
  const [tab, setTab] = useState('stream');
  const [drawer, setDrawer] = useState(false);
  const [dialogMode, setDialogMode] = useState<'ready' | 'pending'>();
  const [switchEnabled, setSwitchEnabled] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState('safe');
  const [filterVisible, setFilterVisible] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(true);
  const [cursor, setCursor] = useState<string>();

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-fg">
      <main className="mx-auto max-w-[1100px] px-4 sm:px-8">
        <PageHeader
          eyebrow="Locked design system"
          title="UI Gallery"
          description="Manga · ink on white paper · dense · square · semantic screentone · hard lift only."
          actions={<Button variant="primary">Primary action</Button>}
        />

        <Section title="Surfaces">
          <div className="grid min-w-0 grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
            {surfaces.map(([name, hex]) => (
              <div key={name} className="min-w-0 bg-surface p-3">
                <div className="h-10 border border-line" style={{ background: hex }} />
                <div className="mt-2 truncate text-xs text-fg">{name}</div>
                <div className="truncate font-mono text-[11px] text-fg-3">{hex}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ink ramp">
          <div className="grid min-w-0 grid-cols-2 gap-px border border-line bg-line sm:grid-cols-4">
            {inkRamp.map(([name, hex]) => (
              <div key={name} className="min-w-0 bg-surface p-3">
                <div className="h-10" style={{ background: hex }} />
                <div className="mt-2 text-xs text-fg">{name}</div>
                <div className="font-mono text-[11px] text-fg-3">{hex}</div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Typography">
          <div className="grid gap-2">
            <div className="text-[22px] font-semibold tracking-tight">Page title — 22 / 600</div>
            <div className="text-sm font-semibold">Section heading — 14 / 600</div>
            <div className="text-sm text-fg-2">Body text — 14 / 400 secondary</div>
            <div className="text-[13px]">Table cell / dense UI — 13 / 400</div>
            <div className="font-mono text-2xl font-semibold tabular-nums">1,284 metric — 24 mono</div>
            <div className="font-mono text-xs text-fg-2">inst_01HՎ… — mono id 12</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Label — 11 uppercase</div>
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary</Button>
            <Button>Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button disabled>Disabled</Button>
            <Button aria-busy>Working…</Button>
            <ButtonLink to="/__ui">Button link</ButtonLink>
            <CloseButton label="Close example" onClick={() => undefined} />
            <Button onClick={() => setDrawer(true)}>Open drawer</Button>
            <Button onClick={() => setDialogMode('ready')}>Open dialog</Button>
            <Button onClick={() => setDialogMode('pending')}>Pending dialog</Button>
          </div>
        </Section>

        <Section title="Status">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {tones.map((t) => (
              <Status key={t} tone={t}>
                {t}
              </Status>
            ))}
          </div>
        </Section>

        <Section title="Form controls">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="API origin" description="Public HTTPS endpoint used by this browser session." required>
              {(id) => <Input id={id} required defaultValue="https://api.example.test" />}
            </Field>
            <Field label="Invalid" error="Enter an available HTTPS origin.">
              {(id) => <Input id={id} defaultValue="bad" />}
            </Field>
            <Field label="Unavailable">{(id) => <Input id={id} disabled value="Managed by server" readOnly />}</Field>
            <Field label="Schedule start">{(id) => <DateTimeInput id={id} defaultValue="2026-07-26T09:30" />}</Field>
            <Field label="Message" description="Vertical resizing is allowed; horizontal resizing is not.">
              {(id) => <Textarea id={id} defaultValue="Projected delivery remains authoritative." />}
            </Field>
            <div className="grid content-start gap-1 border border-line p-3">
              <Checkbox label="Include archived records" description="Applies only to the loaded projection." defaultChecked />
              <Radio name="delivery-mode" label="Safe delivery" description="Respect the server-defined pacing window." value="safe" checked={deliveryMode === 'safe'} onChange={(event) => setDeliveryMode(event.target.value)} />
              <Radio name="delivery-mode" label="Manual review" value="review" checked={deliveryMode === 'review'} onChange={(event) => setDeliveryMode(event.target.value)} />
              <Switch label="Always online" description="Submits one explicit settings command." checked={switchEnabled} onChange={(event) => setSwitchEnabled(event.target.checked)} />
              <Switch label="Unavailable setting" description="Disabled by capability discovery." disabled />
            </div>
          </div>
        </Section>

        <Section title="Filters">
          <div className="border border-line-strong bg-surface">
            <FilterToolbar>
              <Field label="Search" className="min-w-56 flex-1">{(id) => <Input id={id} defaultValue="inst_01" />}</Field>
              <Field label="Status" className="min-w-48">
                {(id, labelId) => (
                  <Select id={id} aria-labelledby={labelId} defaultValue="connected">
                    <option value="">All statuses</option>
                    <option value="connected">Connected</option>
                    <option value="disconnected">Disconnected</option>
                  </Select>
                )}
              </Field>
              <Button variant="primary">Apply filters</Button>
            </FilterToolbar>
            <div className="flex min-h-14 flex-wrap items-center gap-2 p-3">
              {filterVisible ? <FilterChip label="Status" value="connected" onRemove={() => setFilterVisible(false)} /> : <span className="text-xs text-fg-3">No active filters.</span>}
            </div>
          </div>
        </Section>

        <Section title="Panels + data description">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="Instance identity" description="Canonical key/value presentation for inspectors." actions={<Badge>3</Badge>}>
              <DescriptionList>
                <DescriptionItem label="Instance ID" mono>inst_01HZX9Q42</DescriptionItem>
                <DescriptionItem label="Display name">Primary sender with a deliberately long value that wraps safely inside the panel</DescriptionItem>
                <DescriptionItem label="Connection"><Status tone="ok">connected</Status></DescriptionItem>
              </DescriptionList>
            </Panel>
            <Panel title="Command boundary" description="Server acknowledgement does not imply delivery.">
              <StateNotice kind="info" title="Command accepted" detail="Track projected state for completion." requestId="req_01J2F2X9" />
            </Panel>
          </div>
        </Section>

        <Section title="Feedback states">
          <div className="grid gap-3 md:grid-cols-2">
            <StateNotice kind="loading" title="Loading projection" detail="Waiting for the first authoritative response." />
            <StateNotice kind="empty" title="No instances" detail="The loaded page contains no matching records." />
            <StateNotice kind="error" title="Projection unavailable" detail="The request failed without changing server state." requestId="req_01J2F2X9" action={<Button>Retry</Button>} />
            <StateNotice kind="info" title="Projection is stale" detail="Showing the last successful response while refreshing." />
          </div>
          <div className="min-h-28 border border-dashed border-line p-3">
            {notificationVisible ? (
              <div className="ml-auto max-w-md border border-line-strong border-l-2 bg-elevated">
                <FeedbackContent kind="error" title="Command failed" detail="No delivery outcome was inferred." requestId="req_01J2F2X9" action={{ label: 'Retry command', run: () => undefined }} onDismiss={() => setNotificationVisible(false)} />
              </div>
            ) : <Button onClick={() => setNotificationVisible(true)}>Restore notification</Button>}
          </div>
        </Section>

        <Section title="Selectors">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl">
            <Field label="Scope">
              {(id, labelId) => (
                <Select id={id} aria-labelledby={labelId} defaultValue="instance">
                  <option value="admin">Admin</option>
                  <option value="instance">Instance</option>
                </Select>
              )}
            </Field>
            <Field label="Status filter">
              {(id, labelId) => (
                <Select id={id} aria-labelledby={labelId} defaultValue="">
                  <option value="">All statuses</option>
                  <option value="connected">Connected</option>
                  <option value="disconnected">Disconnected</option>
                </Select>
              )}
            </Field>
            <Field label="Invalid selection" error="Choose an available scope">
              {(id, labelId) => (
                <Select id={id} aria-labelledby={labelId} aria-invalid defaultValue="">
                  <option value="">Select scope</option>
                  <option value="admin">Admin</option>
                  <option value="instance">Instance</option>
                </Select>
              )}
            </Field>
            <Field label="Unavailable">
              {(id, labelId) => (
                <Select id={id} aria-labelledby={labelId} disabled>
                  <option>Not available</option>
                </Select>
              )}
            </Field>
          </div>
        </Section>

        <Section title="Metric grid">
          <MetricGrid
            columns={4}
            metrics={[
              { label: 'Instances', value: '18', hint: '2 pairing' },
              { label: 'Queue depth', value: '1,284', hint: '+38 / min' },
              { label: 'Delivered', value: '99.2%', hint: 'last 24h' },
              { label: 'Failed', value: '7', hint: 'action required' },
            ]}
          />
        </Section>

        <Section title="List recipe">
          <Tabs
            active={tab}
            onChange={setTab}
            tabs={[
              { id: 'stream', label: 'Event stream', count: 200 },
              { id: 'audit', label: 'Audit', count: 42 },
            ]}
          />
          <Table>
            <thead>
              <tr>
                <Th>Instance</Th>
                <Th>Status</Th>
                <Th className="text-right">Messages</Th>
                <Th>Last seen</Th>
              </tr>
            </thead>
            <tbody>
              {[
                ['inst_01', 'ok', '12,004', '3m ago', '6'],
                ['inst_02', 'pending', '842', '1m ago', '3'],
                ['inst_03', 'failed', '0', '2h ago', '1'],
              ].map(([id, tone, msgs, seen, count]) => (
                <Tr key={id} onClick={() => setDrawer(true)}>
                  <Td className="font-mono text-xs text-fg-2">{id}</Td>
                  <Td>
                    <Status tone={tone as Tone}>{tone}</Status>
                  </Td>
                  <Td className="text-right tabular-nums">{msgs}</Td>
                  <Td className="text-fg-2">
                    {seen} <Badge>{count}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <CursorPagination cursor={cursor} nextCursor={cursor ? undefined : 'cursor_02'} onCursor={setCursor} info={cursor ? 'Showing the next cursor page.' : 'Showing 3 of 18 instances.'} />
        </Section>

        <Section title="Implementation recipes">
          <div className="grid gap-4 lg:grid-cols-3">
            <Panel title="List" description="Filter → state → rows → cursor." actions={<Button>Refresh</Button>}>
              <p className="text-sm text-fg-2">Use the complete list recipe above for every paginated projection.</p>
            </Panel>
            <Panel title="Inspector" description="Selection opens a bounded detail surface." actions={<Button onClick={() => setDrawer(true)}>Inspect</Button>}>
              <p className="text-sm text-fg-2">Keep identity, status, facts, and narrow actions together.</p>
            </Panel>
            <Panel title="Command / recovery" description="Explain impact before explicit intent." actions={<Button variant="danger" onClick={() => setDialogMode('ready')}>Review command</Button>}>
              <p className="text-sm text-fg-2">Lock dismissal while pending and render acknowledgement honestly.</p>
            </Panel>
          </div>
        </Section>
      </main>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="inst_01" subtitle="inst_01HZX9Q…">
        <div className="grid gap-3">
          <Status tone="ok">connected</Status>
          <p className="text-sm text-fg-2">Framed right-side inspector with a strong header, scroll-safe body, and responsive bottom-sheet treatment.</p>
          <DescriptionList>
            <DescriptionItem label="Phone" mono>84901234567</DescriptionItem>
            <DescriptionItem label="Queue depth" mono>1,284</DescriptionItem>
            <DescriptionItem label="Last seen">3 minutes ago</DescriptionItem>
          </DescriptionList>
          {Array.from({ length: 16 }, (_, index) => <p key={index} className="border-t border-line pt-3 text-sm text-fg-2">Bounded inspector content row {index + 1}.</p>)}
        </div>
      </Drawer>

      <Dialog
        open={dialogMode !== undefined}
        onClose={() => setDialogMode(undefined)}
        title="Destroy instance"
        closeDisabled={dialogMode === 'pending'}
        footer={
          <>
            <Button disabled={dialogMode === 'pending'} onClick={() => setDialogMode(undefined)}>Cancel</Button>
            <Button variant="danger" aria-busy={dialogMode === 'pending'}>{dialogMode === 'pending' ? 'Destroying…' : 'Destroy'}</Button>
          </>
        }
      >
        <div className="grid gap-3">
          <StateNotice kind={dialogMode === 'pending' ? 'loading' : 'error'} title={dialogMode === 'pending' ? 'Command pending' : 'Destructive command'} detail={dialogMode === 'pending' ? 'Dismissal is locked until the request settles.' : 'This command retires the selected instance. It does not imply message delivery outcomes.'} />
          <Field label="Confirmation" description="Enter the instance ID before enabling the command.">{(id) => <Input id={id} defaultValue="inst_01" disabled={dialogMode === 'pending'} />}</Field>
        </div>
      </Dialog>
    </div>
  );
}
