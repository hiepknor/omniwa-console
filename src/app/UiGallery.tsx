import { useState } from 'react';
import { ApiFailure } from '@/api/envelopes';
import { ApiFailureNotice } from '@/components/ApiFailureNotice';
import { SurfaceNotice } from '@/components/feedback/SurfaceNotice';
import { ToastViewport } from '@/components/feedback/ToastViewport';
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
  Icon,
  Image,
  Input,
  Logo,
  MetricGrid,
  NavigationItemContent,
  navigationItemClassName,
  PageHeader,
  Panel,
  ProgressBar,
  Radio,
  Select,
  SplitWorkspace,
  StateNotice,
  Status,
  Switch,
  Table,
  Tabs,
  Td,
  Th,
  Textarea,
  Tr,
  WorkspacePaneHeader,
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

const galleryRateLimit = new ApiFailure(
  { error: 'The read budget is cooling down.', code: 'rate_limited', retryAfter: 3_600 },
  429,
  new Headers({ 'X-Request-ID': 'req_01RATE_LIMIT' }),
);

const statusExamples: { tone: Tone; label: string; use: string }[] = [
  { tone: 'ok', label: 'Connected', use: 'healthy / delivered' },
  { tone: 'pending', label: 'Pairing', use: 'queued / running' },
  { tone: 'degraded', label: 'Retrying', use: 'stale / throttled' },
  { tone: 'failed', label: 'Disconnected', use: 'failed / dead' },
  { tone: 'info', label: 'Live projection', use: 'informational' },
  { tone: 'neutral', label: 'Unknown', use: 'retired / unreported' },
];
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
const navigationItems = [
  ['overview', 'Overview'],
  ['instances', 'Instances'],
  ['chats', 'Conversations'],
  ['groups', 'Groups'],
  ['campaigns', 'Campaigns'],
  ['events', 'Events'],
] as const;

function ShellAnatomy() {
  return (
    <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div className="grid h-80 grid-cols-[224px_minmax(0,1fr)] overflow-hidden border border-line-strong bg-bg">
        <aside className="flex min-w-0 flex-col border-r border-line-strong bg-surface">
          <div className="flex min-h-[57px] items-center gap-3 border-b border-line px-4">
            <Logo />
            <span className="grid min-w-0"><strong className="text-[13px] font-semibold">OmniWA Console</strong><span className="truncate font-mono text-[10px] text-fg-3">https://api.example.test</span></span>
          </div>
          <div className="grid gap-2 border-b border-line p-4"><Status tone="ok">12 capabilities</Status><span className="font-mono text-[10px] text-fg-3">GO 1.8.0</span></div>
          <nav aria-label="Full rail example" className="grid gap-0.5 p-3">
            {navigationItems.slice(0, 4).map(([icon, label], index) => <div key={icon} className={navigationItemClassName(index === 0)}><NavigationItemContent icon={icon} label={label} /></div>)}
          </nav>
        </aside>
        <div className="min-w-0 p-4"><span className="text-[11px] font-medium uppercase tracking-wider text-fg-3">Content viewport</span><div className="mt-3 h-28 border border-line-strong bg-surface" /></div>
      </div>
      <div className="grid gap-4">
        <div className="grid h-44 grid-cols-[64px_minmax(0,1fr)] overflow-hidden border border-line-strong">
          <nav aria-label="Compact rail example" className="grid content-start gap-0.5 border-r border-line-strong bg-surface p-3">
            {navigationItems.slice(0, 3).map(([icon, label], index) => <div key={icon} title={label} className={navigationItemClassName(index === 0, 'justify-center px-0')}><Icon name={icon} size="nav" /><span className="sr-only">{label}</span></div>)}
          </nav>
          <div className="bg-bg p-3 text-[11px] uppercase tracking-wider text-fg-3">64px rail</div>
        </div>
        <div className="grid overflow-hidden border border-line-strong bg-bg">
          <div className="h-20 p-3 text-[11px] uppercase tracking-wider text-fg-3">Mobile content reserves bottom-nav space</div>
          <nav aria-label="Mobile navigation example" className="flex overflow-x-auto border-t border-line-strong bg-surface p-2">
            {navigationItems.slice(0, 4).map(([icon, label], index) => <div key={icon} className={navigationItemClassName(index === 0, 'min-h-11 min-w-[72px] flex-col justify-center gap-0.5 px-2')}><Icon name={icon} size="nav" /><span className="text-[10px]">{label}</span></div>)}
          </nav>
        </div>
      </div>
    </div>
  );
}

export function UiGallery() {
  const [tab, setTab] = useState('stream');
  const [drawer, setDrawer] = useState(false);
  const [dialogMode, setDialogMode] = useState<'ready' | 'pending'>();
  const [switchEnabled, setSwitchEnabled] = useState(true);
  const [deliveryMode, setDeliveryMode] = useState('safe');
  const [filterVisible, setFilterVisible] = useState(true);
  const [listFilterVisible, setListFilterVisible] = useState(true);
  const [notificationVisible, setNotificationVisible] = useState(true);
  const [cursor, setCursor] = useState<string>();
  const [workspaceDetail, setWorkspaceDetail] = useState(true);

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

        <Section title="Brand + iconography">
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-3 border border-line-strong p-3"><Logo className="size-8" /><span className="text-sm font-semibold">OmniWA Console</span></div>
            {navigationItems.map(([name, label]) => <div key={name} className="grid min-w-20 justify-items-center gap-1 border border-line p-3"><Icon name={name} size="nav" /><span className="text-[11px] text-fg-3">{label}</span></div>)}
            <div className="grid min-w-20 justify-items-center gap-1 border border-line p-3"><Icon name="close" /><span className="text-[11px] text-fg-3">Close</span></div>
            <div className="grid min-w-20 justify-items-center gap-1 border border-line p-3"><Icon name="chevron-down" /><span className="text-[11px] text-fg-3">Disclosure</span></div>
          </div>
        </Section>

        <Section title="Shell + navigation">
          <ShellAnatomy />
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
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
            {statusExamples.map(({ tone, label, use }) => (
              <div key={tone} className="grid gap-2 bg-surface p-3">
                <Status tone={tone}>{label}</Status>
                <span className="font-mono text-[10px] text-fg-3">{tone} · {use}</span>
              </div>
            ))}
          </div>
          <div className="flex max-w-sm items-center justify-between gap-3 border border-line p-3">
            <span className="text-xs text-fg-3">Constrained operational row</span>
            <Status tone="degraded" wrap>Projection syncing with a longer explicit label</Status>
          </div>
        </Section>

        <Section title="Progress">
          <div className="grid gap-4 md:grid-cols-2">
            <ProgressBar label="Projection replay" value={38} />
            <ProgressBar label="Unknown-duration synchronization" />
            <ProgressBar label="Completed import" value={100} status="complete" />
            <ProgressBar label="Failed delivery batch" value={64} status="failed" />
          </div>
        </Section>

        <Section title="Images">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Image src="/ui-image-sample.svg" alt="Monochrome OmniWA operations sample" caption="Ready · video ratio · cover" />
            <Image src="/ui-image-sample.svg" alt="Loading operations sample" state="loading" fit="contain" caption="Loading · contained media" />
            <Image alt="Unavailable operations sample" state="error" caption="Error / missing source fallback" />
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
            <ApiFailureNotice error={galleryRateLimit} title="Read rate limited" onRetry={() => undefined} />
          </div>
          <div className="min-h-28 border border-dashed border-line p-3">
            {notificationVisible ? (
              <ToastViewport placement="inline" toasts={[{ id: 'gallery-error', createdAt: 0, kind: 'error', title: 'Command failed', detail: 'No delivery outcome was inferred.', requestId: 'req_01J2F2X9', action: { label: 'Retry command', run: () => undefined } }]} onDismiss={() => setNotificationVisible(false)} />
            ) : <Button onClick={() => setNotificationVisible(true)}>Restore notification</Button>}
          </div>
          <SurfaceNotice kind="error" label="Connection" title="OmniWA API is unreachable" detail="Workspace banner placement uses this production notice primitive." action={{ label: 'Retry active reads', run: () => undefined }} announcement="polite" />
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
          <FilterToolbar>
            <Field label="Status" className="min-w-48 flex-1">
              {(id, labelId) => <Select id={id} aria-labelledby={labelId} defaultValue=""><option value="">All statuses</option><option value="ok">Healthy</option><option value="failed">Failed</option></Select>}
            </Field>
            {listFilterVisible ? <FilterChip label="Status" value="connected" onRemove={() => setListFilterVisible(false)} /> : null}
            <Button>Apply filters</Button>
          </FilterToolbar>
          <div className="p-3"><StateNotice kind="info" title="Projection ready" detail="Rows below are authoritative for this cursor page." /></div>
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

        <Section title="Split workspace recipe">
          <div className="flex h-80 min-h-0 flex-col overflow-hidden border border-line-strong">
            <SplitWorkspace
              className="border-t-0"
              detailOpen={workspaceDetail}
              directoryLabel="Sample directory"
              detailLabel="Sample detail"
              directory={
                <>
                  <WorkspacePaneHeader title="Directory" description="Select a projected resource" />
                  {['chat_01', 'chat_02', 'chat_03'].map((id) => <button key={id} type="button" className="flex min-h-14 w-full items-center border-b border-line px-3 text-left text-[13px] hover:bg-elevated" onClick={() => setWorkspaceDetail(true)}><span className="font-mono">{id}</span></button>)}
                </>
              }
              detail={
                <>
                  <WorkspacePaneHeader title="chat_01" description="Projected detail" actions={<Button className="hidden max-[900px]:inline-flex" onClick={() => setWorkspaceDetail(false)}>Back</Button>} />
                  <div className="grid gap-3 p-4"><Status tone="ok">Ready</Status><DescriptionList><DescriptionItem label="Identifier" mono>chat_01</DescriptionItem><DescriptionItem label="Updated">Just now</DescriptionItem></DescriptionList></div>
                </>
              }
              detailFooter={<div className="flex justify-end border-t border-line p-3"><Button variant="primary">Narrow action</Button></div>}
            />
          </div>
        </Section>

        <Section title="Implementation recipes">
          <div className="grid gap-4 md:grid-cols-2">
            <Panel title="List" description="Filter → state → rows → cursor." actions={<Button>Refresh</Button>}>
              <p className="text-sm text-fg-2">Use the complete list recipe above for every paginated projection.</p>
            </Panel>
            <Panel title="Inspector" description="Selection opens a bounded detail surface." actions={<Button onClick={() => setDrawer(true)}>Inspect</Button>}>
              <p className="text-sm text-fg-2">Keep identity, status, facts, and narrow actions together.</p>
            </Panel>
            <Panel title="Command / recovery" description="Explain impact before explicit intent." actions={<Button variant="danger" onClick={() => setDialogMode('ready')}>Review command</Button>}>
              <p className="text-sm text-fg-2">Lock dismissal while pending and render acknowledgement honestly.</p>
            </Panel>
            <Panel title="Split workspace" description="Directory and detail share one responsive frame." actions={<Button onClick={() => setWorkspaceDetail(true)}>Open detail</Button>}>
              <p className="text-sm text-fg-2">At tablet and mobile widths, detail replaces the directory and always exposes Back.</p>
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
