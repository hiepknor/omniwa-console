import type { ChatResource } from '@/api/chats';
import type { ContactResource } from '@/api/contacts';
import type { ProjectionMeta } from '@/api/envelopes';
import type { LabelResource } from '@/api/labels';
import { humanizeToken, relativeTime } from '@/lib/format';
import { DescriptionItem, DescriptionList, Drawer, Panel, StateNotice, Status, type Tone } from '@/ui';
import { useMessage, useReceipts } from './hooks';
import { ConversationMessageImage } from './Media';
import { FailureNotice, ProjectionStatus } from './ui';

function receiptTone(type: string): Tone {
  return type === 'read' || type === 'delivered' ? 'ok' : 'pending';
}

export function DirectoryInspector({ contact, label, meta, error, loading, onRetry, onClose }: { contact?: ContactResource; label?: LabelResource; meta?: ProjectionMeta; error?: unknown; loading: boolean; onRetry: () => void; onClose: () => void }) {
  const title = contact?.displayName ?? label?.name ?? (contact ? 'Unknown contact' : label?.id) ?? 'Directory details';
  return (
    <Drawer open onClose={onClose} title={title} subtitle={contact ? 'Projected contact' : 'Projected label'}>
      {loading ? (
        <StateNotice kind="loading" title="Loading" />
      ) : error && !contact && !label ? (
        <FailureNotice error={error} onRetry={onRetry} />
      ) : contact ? (
        <div className="grid gap-4">
          {error ? <FailureNotice error={error} stale onRetry={onRetry} /> : null}
          <ProjectionStatus meta={meta} />
          <Panel
            title={contact.identityStatus === 'legacy' ? 'Normalized identity' : 'Canonical identity'}
            description={contact.identityStatus === 'legacy' ? 'Compatibility projection fields; canonical reconciliation is not active for this instance.' : 'The backend owns reconciliation. Aliases are lookup material, not separate contacts.'}
            bodyPadding="compact-top"
          >
            <DescriptionList>
              <DescriptionItem label="Contact ID" mono>{contact.id}</DescriptionItem>
              <DescriptionItem label="Addressing JID" mono>{contact.addressingJid || 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Identity status">{humanizeToken(contact.identityStatus)}</DescriptionItem>
              <DescriptionItem label="Identity updated">{contact.identityUpdatedAt ? (relativeTime(contact.identityUpdatedAt) || contact.identityUpdatedAt) : 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Display source">{contact.displayNameSource ? humanizeToken(contact.displayNameSource) : 'Compatibility projection'}</DescriptionItem>
              <DescriptionItem label="Aliases" mono>{contact.aliases.length ? contact.aliases.join(', ') : 'None reported'}</DescriptionItem>
              <DescriptionItem label="Username">{contact.username ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Phone">{contact.redactedPhone ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Business">{contact.businessName ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="About">{contact.about ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="WhatsApp contact found">{contact.found ? 'Yes' : 'No'}</DescriptionItem>
            </DescriptionList>
          </Panel>
        </div>
      ) : label ? (
        <div className="grid gap-4">
          {error ? <FailureNotice error={error} stale onRetry={onRetry} /> : null}
          <ProjectionStatus meta={meta} />
          <Panel title="Projected definition" description="Definitions are read-only; Console does not infer chat-label assignments." bodyPadding="compact-top">
            <DescriptionList>
              <DescriptionItem label="Label ID" mono>{label.id}</DescriptionItem>
              <DescriptionItem label="Name">{label.name ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Color">{label.color ?? 'Not reported'}</DescriptionItem>
              <DescriptionItem label="Predefined ID">{label.predefinedId ?? 'Not reported'}</DescriptionItem>
            </DescriptionList>
          </Panel>
        </div>
      ) : (
        <StateNotice kind="empty" title="Not found" detail="The selected projected definition was not returned." />
      )}
    </Drawer>
  );
}

export function MessageInspector({ messageId, loadedChat, enabled, mediaEnabled, onClose }: { messageId: string; loadedChat?: ChatResource; enabled: boolean; mediaEnabled: boolean; onClose: () => void }) {
  const message = useMessage(messageId, enabled);
  const resource = message.data?.resource;
  const matchesChat = resource === undefined || loadedChat === undefined || resource.chatId === loadedChat.id;
  const receipts = useReceipts(messageId, enabled && resource !== undefined && matchesChat);
  const statusTone: Tone | undefined = resource?.status
    ? resource.status === 'failed' ? 'failed' : resource.status === 'read' || resource.status === 'delivered' ? 'ok' : 'pending'
    : undefined;
  return (
    <Drawer open onClose={onClose} title="Message details" subtitle={messageId}>
      <div className="grid gap-4">
        {statusTone ? <Status tone={statusTone}>{humanizeToken(resource!.status!)}</Status> : null}
        {message.isPending ? (
          <StateNotice kind="loading" title="Loading message" />
        ) : message.error && !resource ? (
          <FailureNotice error={message.error} onRetry={() => message.refetch()} />
        ) : resource && !matchesChat ? (
          <StateNotice kind="empty" title="Different chat" detail="The selected message belongs to a different projected chat and is not shown in this context." />
        ) : resource ? (
          <>
            {message.error ? <FailureNotice error={message.error} stale onRetry={() => message.refetch()} /> : null}
            <ProjectionStatus meta={message.data?.meta} />
            {resource.mediaAssetId || resource.mediaType === 'image' ? <ConversationMessageImage message={resource} enabled={mediaEnabled} priority /> : null}
            <Panel title="Message facts" description="Projected status is authoritative; command acknowledgement is not delivery." bodyPadding="compact-top">
              <DescriptionList>
                <DescriptionItem label="Chat" mono>{resource.chatId}</DescriptionItem>
                <DescriptionItem label="Direction">{humanizeToken(resource.direction)}</DescriptionItem>
                <DescriptionItem label="Type">{humanizeToken(resource.type)}</DescriptionItem>
                <DescriptionItem label="Provenance">{humanizeToken(resource.provenance)}</DescriptionItem>
                <DescriptionItem label="Message timestamp">{relativeTime(resource.createdAt) || resource.createdAt}</DescriptionItem>
                <DescriptionItem label="Sender" mono>{resource.senderJid ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Recipient" mono>{resource.recipientJid ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Participant" mono>{resource.participantJid ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Media asset" mono>{resource.mediaAssetId ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Media MIME">{resource.mediaMimeType ?? 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Media size">{resource.mediaSize === undefined ? 'Not reported' : `${resource.mediaSize.toLocaleString()} bytes`}</DescriptionItem>
                <DescriptionItem label="Sent">{resource.sentAt ? (relativeTime(resource.sentAt) || resource.sentAt) : 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Delivered">{resource.deliveredAt ? (relativeTime(resource.deliveredAt) || 'Not reported') : 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Read">{resource.readAt ? (relativeTime(resource.readAt) || 'Not reported') : 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Played">{resource.playedAt ? (relativeTime(resource.playedAt) || 'Not reported') : 'Not reported'}</DescriptionItem>
                <DescriptionItem label="Retention expiry">{resource.retentionExpiresAt ? (relativeTime(resource.retentionExpiresAt) || resource.retentionExpiresAt) : 'Not reported'}</DescriptionItem>
              </DescriptionList>
            </Panel>
          </>
        ) : (
          <StateNotice kind="empty" title="Not returned" />
        )}

        {resource && matchesChat ? (
          <Panel title="Delivery receipts" description="Per-recipient projected receipts.">
            {receipts.isPending ? (
              <StateNotice kind="loading" title="Loading receipts" />
            ) : receipts.error && !receipts.data ? (
              <FailureNotice error={receipts.error} onRetry={() => receipts.refetch()} />
            ) : receipts.data ? (
              <>
                {receipts.error ? <FailureNotice error={receipts.error} stale onRetry={() => receipts.refetch()} /> : null}
                <ProjectionStatus meta={receipts.data.meta} />
                {receipts.data.resource.length ? (
                <ul className="grid">
                  {receipts.data.resource.map((r) => (
                    <li key={`${r.recipientJid}-${r.receiptType}-${r.receiptAt}`} className="flex items-center justify-between gap-3 py-1.5 border-b border-line last:border-b-0">
                      <Status tone={receiptTone(r.receiptType)}>{humanizeToken(r.receiptType)}</Status>
                      <span className="font-mono text-xs text-fg-2 truncate">{r.recipientJid}</span>
                      <time className="text-xs text-fg-3" title={r.receiptAt}>{relativeTime(r.receiptAt)}</time>
                    </li>
                  ))}
                </ul>
              ) : (
                <StateNotice kind="empty" title="No receipts" detail="No per-recipient receipts have been projected." />
                )}
              </>
            ) : null}
          </Panel>
        ) : null}
      </div>
    </Drawer>
  );
}
