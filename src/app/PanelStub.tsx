import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';

const PANEL_TITLES: Record<string, string> = {
  overview: 'Overview',
  instances: 'Instances',
  chats: 'Chats',
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
  groups: 'Messaging',
  messages: 'Messaging',
  settings: 'System',
  'admin-keys': 'System',
};

/** A direct-link fallback for a surface blocked on a public platform contract. */
export function PanelStub({ panel }: { panel: string }) {
  const params = useParams();
  const scope = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join(', ');
  const title = PANEL_TITLES[panel] ?? panel;

  return (
    <>
      <PageHeader title={title} eyebrow={PANEL_SECTIONS[panel]} />
      <div className="card">
        <div className="empty">
          <h2 className="text-base font-medium">This surface is not available yet.</h2>
          <p className="mt-2 text-sm">
            Campaign and send-list operations are waiting for a public platform contract.
          </p>
          {scope && <p className="mt-1 text-xs text-(--meta)">{scope}</p>}
        </div>
      </div>
    </>
  );
}
