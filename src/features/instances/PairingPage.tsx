import { useApiSession } from '@/api/ApiProvider';
import { SESSION_QUERY_SCOPE } from '@/api/keys';
import { DescriptionItem, DescriptionList, PageHeader, Panel, StateNotice, Status } from '@/ui';
import { ConnectionAndPairing, useInstancePairing } from './ConnectionAndPairing';

export function whatsappNameWhenLoggedIn(loggedIn: boolean, name: string | undefined): string | undefined {
  if (!loggedIn) return undefined;
  const normalized = name?.trim();
  return normalized || undefined;
}

export function PairingPage() {
  const session = useApiSession();
  const token = session.keyKind === 'api' ? session.apiKey : undefined;
  const pairing = useInstancePairing(SESSION_QUERY_SCOPE, token);

  if (!token) {
    return (
      <div className="grid gap-6 p-6 max-sm:p-4">
        <PageHeader eyebrow="Runtime" title="Instance" description="Inspect and manage the active instance credential." />
        <StateNotice kind="empty" title="Instance credential required" detail="Connection and pairing uses the active instance credential. No provider request was sent." />
      </div>
    );
  }

  const status = !pairing.statusReady
    ? { tone: 'pending' as const, label: 'Reading status' }
    : pairing.loggedIn
      ? { tone: 'ok' as const, label: 'Paired' }
      : pairing.connected
        ? { tone: 'pending' as const, label: 'Pairing' }
        : { tone: 'failed' as const, label: 'Disconnected' };
  const whatsappName = whatsappNameWhenLoggedIn(pairing.loggedIn, pairing.status.data?.name);

  return (
    <div className="grid gap-6 p-6 max-sm:p-4">
      <PageHeader
        eyebrow="Runtime"
        title="Instance"
        description="Inspect connection state and manage WhatsApp pairing for the active runtime."
      />
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <Panel title="Active instance" description="Live token-scoped status; server facts remain authoritative.">
          <div className="grid gap-3">
            <Status tone={status.tone}>{status.label}</Status>
            <DescriptionList>
              <DescriptionItem label="Connection">{pairing.statusReady ? (pairing.connected ? 'Connected' : 'Disconnected') : 'Not read'}</DescriptionItem>
              <DescriptionItem label="Paired">{pairing.statusReady ? (pairing.loggedIn ? 'Yes' : 'No') : 'Not read'}</DescriptionItem>
              {whatsappName ? <DescriptionItem label="WhatsApp name">{whatsappName}</DescriptionItem> : null}
            </DescriptionList>
            <StateNotice kind="info" title="Memory-only credential" detail="Reload or Sign out clears this credential from Console memory." />
          </div>
        </Panel>
        <ConnectionAndPairing controller={pairing} />
      </div>
    </div>
  );
}
