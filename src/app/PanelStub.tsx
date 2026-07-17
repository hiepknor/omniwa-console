import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

const PANEL_TITLES: Record<string, string> = {
  overview: 'Overview',
  instances: 'Instances',
  chats: 'Chats',
  contacts: 'Contacts',
  labels: 'Labels',
  groups: 'Groups',
  messages: 'Messages',
  queue: 'Queue & Jobs',
  webhooks: 'Webhooks',
  events: 'Events',
  settings: 'Settings',
  'admin-keys': 'API Keys',
};

const PANEL_SECTIONS: Record<string, string> = {
  overview: 'Console',
  instances: 'Operations',
  queue: 'Operations',
  webhooks: 'Operations',
  events: 'Operations',
  chats: 'Messaging',
  contacts: 'Messaging',
  labels: 'Messaging',
  groups: 'Messaging',
  messages: 'Messaging',
  settings: 'System',
  'admin-keys': 'System',
};

/**
 * Placeholder for a panel that has not been implemented yet.
 * Each panel's scope and allowed operation IDs are defined in docs/PANELS.md;
 * implementations replace this stub milestone by milestone
 * (see docs/IMPLEMENTATION_PLAN.md).
 */
export function PanelStub({ panel }: { panel: string }) {
  const params = useParams();
  const scope = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  const title = PANEL_TITLES[panel] ?? panel;

  return (
    <>
      <PageHeader title={title} eyebrow={PANEL_SECTIONS[panel]} />
      <div className="card" style={{ borderStyle: 'dashed' }}>
        <div className="empty">
          <h2 className="text-base font-medium">Panel scaffold</h2>
          <p className="mt-2 text-sm">
            Not implemented yet. See <code>docs/PANELS.md#{panel}</code>.
          </p>
          {scope && <p className="mt-1 text-xs text-(--meta)">{scope}</p>}
        </div>
      </div>
    </>
  );
}
