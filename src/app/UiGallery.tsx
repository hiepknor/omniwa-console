import { useState } from 'react';
import {
  Badge,
  Button,
  Dialog,
  Drawer,
  Field,
  Input,
  MetricGrid,
  PageHeader,
  Select,
  Status,
  Table,
  Tabs,
  Td,
  Th,
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
  ['fg-3', '#8c8c8c'],
  ['line', '#e2e2e2'],
];

export function UiGallery() {
  const [tab, setTab] = useState('stream');
  const [drawer, setDrawer] = useState(false);
  const [dialog, setDialog] = useState(false);

  return (
    <div className="min-h-dvh overflow-x-clip bg-bg text-fg">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-8">
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
            <Button onClick={() => setDrawer(true)}>Open drawer</Button>
            <Button onClick={() => setDialog(true)}>Open dialog</Button>
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

        <Section title="Inputs">
          <div className="grid sm:grid-cols-2 gap-4 max-w-xl">
            <Field label="API origin">{(id) => <Input id={id} placeholder="https://…" />}</Field>
            <Field label="Invalid" error="Required">
              {(id) => <Input id={id} aria-invalid placeholder="bad" />}
            </Field>
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

        <Section title="Tabs + table">
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
                ['inst_01', 'ok', '12,004', '3m ago'],
                ['inst_02', 'pending', '842', '1m ago'],
                ['inst_03', 'failed', '0', '2h ago'],
              ].map(([id, tone, msgs, seen]) => (
                <Tr key={id} onClick={() => setDrawer(true)}>
                  <Td className="font-mono text-xs text-fg-2">{id}</Td>
                  <Td>
                    <Status tone={tone as Tone}>{tone}</Status>
                  </Td>
                  <Td className="text-right tabular-nums">{msgs}</Td>
                  <Td className="text-fg-2">
                    {seen} <Badge>{Math.floor(Math.random() * 9)}</Badge>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Section>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="inst_01" subtitle="inst_01HZX9Q…">
        <div className="grid gap-3">
          <Status tone="ok">connected</Status>
          <p className="text-sm text-fg-2">Framed right-side inspector with a strong header, scroll-safe body, and responsive bottom-sheet treatment.</p>
        </div>
      </Drawer>

      <Dialog
        open={dialog}
        onClose={() => setDialog(false)}
        title="Destroy instance"
        footer={
          <>
            <Button onClick={() => setDialog(false)}>Cancel</Button>
            <Button variant="danger">Destroy</Button>
          </>
        }
      >
        <p className="text-sm text-fg-2">Framed command surface with explicit dismissal, bounded scrolling, and a stable action footer.</p>
      </Dialog>
    </div>
  );
}
