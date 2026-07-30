import type { ConversationResource } from '@/api/conversations';
import type { ContactResource } from '@/api/contacts';
import type { ProjectionMeta } from '@/api/envelopes';
import type { LabelResource } from '@/api/labels';
import { humanizeToken, relativeTime } from '@/lib/format';
import { CopyValue, CountBadge, DescriptionItem, DescriptionList, Drawer, Panel, StateNotice, Status, type Tone } from '@/ui';
import { useMessage, useReceipts } from './hooks';
import { ConversationMessageImage } from './Media';
import { FailureNotice, ProjectionStatus } from './ui';

function receiptTone(type: string): Tone {
  return type === 'read' || type === 'delivered' ? 'ok' : 'pending';
}

function reportedBoolean(value: boolean | undefined): string {
  return value === undefined ? 'Not reported' : value ? 'Yes' : 'No';
}

function ReportedTime({ value }: { value?: string }) {
  return value ? <time title={value}>{relativeTime(value) || value}</time> : <>Not reported</>;
}

function CopyableFact({ value, label }: { value?: string; label: string }) {
  return value ? <CopyValue value={value} label={label} /> : <>Not reported</>;
}

function projectedDuration(seconds: number): string {
  const exact = `${seconds.toLocaleString('en-US')}s`;
  if (seconds > 0 && seconds % 86_400 === 0) return `${(seconds / 86_400).toLocaleString('en-US')} ${seconds === 86_400 ? 'day' : 'days'} · ${exact}`;
  if (seconds > 0 && seconds % 3_600 === 0) return `${(seconds / 3_600).toLocaleString('en-US')} ${seconds === 3_600 ? 'hour' : 'hours'} · ${exact}`;
  if (seconds > 0 && seconds % 60 === 0) return `${(seconds / 60).toLocaleString('en-US')} ${seconds === 60 ? 'minute' : 'minutes'} · ${exact}`;
  return exact;
}

export function ConversationDetailsContent({ conversation }: { conversation: ConversationResource }) {
  const aliases = !conversation.aliasesReported
    ? 'Not reported'
    : conversation.aliases.length
      ? conversation.aliases.join(', ')
      : 'None';
  return (
    <div className="grid gap-4">
      <Panel headingLevel={3} title="Canonical identity" description="Backend-projected identity; Console does not merge Conversations or derive a display name." bodyPadding="compact-top">
        <DescriptionList>
          <DescriptionItem label="Display name">{conversation.displayName ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Name source">{conversation.displayNameSource ? humanizeToken(conversation.displayNameSource) : 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Name updated"><ReportedTime value={conversation.displayNameUpdatedAt} /></DescriptionItem>
          <DescriptionItem label="Type">{humanizeToken(conversation.type)}</DescriptionItem>
          <DescriptionItem label="Conversation ID" mono><CopyableFact value={conversation.conversationId} label="Conversation ID" /></DescriptionItem>
          <DescriptionItem label="Contact ID" mono><CopyableFact value={conversation.contactId} label="Contact ID" /></DescriptionItem>
        </DescriptionList>
      </Panel>

      <Panel headingLevel={3} title="Provider routing" description="Provider identifiers are diagnostic material. Commands use only the authoritative addressing target." bodyPadding="compact-top">
        <DescriptionList>
          <DescriptionItem label="Command target"><Status tone={conversation.addressingJid ? 'ok' : 'neutral'}>{conversation.addressingJid ? 'Available' : 'Unreported'}</Status></DescriptionItem>
          <DescriptionItem label="Addressing JID" mono><CopyableFact value={conversation.addressingJid} label="Addressing JID" /></DescriptionItem>
          <DescriptionItem label="Alias count">{conversation.aliasesReported ? conversation.aliases.length.toLocaleString('en-US') : 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Provider aliases" mono>{conversation.aliasesReported && conversation.aliases.length ? <CopyValue value={aliases} label="Provider aliases" /> : aliases}</DescriptionItem>
        </DescriptionList>
      </Panel>

      <Panel headingLevel={3} title="Projected state" description="Read-only Conversation state and activity reported by the projection." bodyPadding="compact-top">
        <DescriptionList>
          <DescriptionItem label="Unread"><CountBadge count={conversation.unreadCount} /></DescriptionItem>
          <DescriptionItem label="Archived">{reportedBoolean(conversation.archived)}</DescriptionItem>
          <DescriptionItem label="Pinned">{reportedBoolean(conversation.pinned)}</DescriptionItem>
          <DescriptionItem label="Muted until"><ReportedTime value={conversation.mutedUntil} /></DescriptionItem>
          <DescriptionItem label="Disappearing timer">{conversation.disappearingTimer === undefined ? 'Not reported' : projectedDuration(conversation.disappearingTimer)}</DescriptionItem>
          <DescriptionItem label="Last message ID" mono><CopyableFact value={conversation.lastMessageId} label="Last message ID" /></DescriptionItem>
          <DescriptionItem label="Last message"><ReportedTime value={conversation.lastMessageAt} /></DescriptionItem>
          <DescriptionItem label="Last activity"><ReportedTime value={conversation.lastActivityAt} /></DescriptionItem>
        </DescriptionList>
      </Panel>
    </div>
  );
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
            headingLevel={3}
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
              <DescriptionItem label="WhatsApp contact found">{contact.found === undefined ? 'Not reported' : contact.found ? 'Yes' : 'No'}</DescriptionItem>
            </DescriptionList>
          </Panel>
        </div>
      ) : label ? (
        <div className="grid gap-4">
          {error ? <FailureNotice error={error} stale onRetry={onRetry} /> : null}
          <ProjectionStatus meta={meta} />
          <Panel headingLevel={3} title="Projected definition" description="Definitions are read-only; Console does not infer chat-label assignments." bodyPadding="compact-top">
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

export function MessageInspectorContent({ messageId, loadedConversation, enabled, mediaEnabled }: { messageId: string; loadedConversation: ConversationResource; enabled: boolean; mediaEnabled: boolean }) {
  const message = useMessage(loadedConversation.conversationId, messageId, enabled);
  const resource = message.data?.resource;
  const matchesConversation = resource === undefined || resource.conversationId === loadedConversation.conversationId;
  const receipts = useReceipts(loadedConversation.conversationId, messageId, enabled && resource !== undefined && matchesConversation);
  const statusTone: Tone | undefined = resource?.status
    ? resource.status === 'failed' ? 'failed' : resource.status === 'read' || resource.status === 'delivered' ? 'ok' : 'pending'
    : undefined;
  return (
    <div className="grid gap-4">
        {statusTone ? <Status tone={statusTone}>{humanizeToken(resource!.status!)}</Status> : null}
        {message.isPending ? (
          <StateNotice kind="loading" title="Loading message" />
        ) : message.error && !resource ? (
          <FailureNotice error={message.error} onRetry={() => message.refetch()} />
        ) : resource && !matchesConversation ? (
          <StateNotice kind="empty" title="Different conversation" detail="The selected message belongs to a different canonical conversation and is not shown in this context." />
        ) : resource ? (
          <>
            {message.error ? <FailureNotice error={message.error} stale onRetry={() => message.refetch()} /> : null}
            <ProjectionStatus meta={message.data?.meta} />
            {resource.mediaAssetId || resource.mediaType === 'image' ? <ConversationMessageImage message={resource} enabled={mediaEnabled} priority /> : null}
            <Panel headingLevel={3} title="Message facts" description="Projected status is authoritative; command acknowledgement is not delivery." bodyPadding="compact-top">
              <DescriptionList>
                <DescriptionItem label="Message ID" mono><CopyableFact value={resource.id} label="Message ID" /></DescriptionItem>
                <DescriptionItem label="Conversation" mono><CopyableFact value={resource.conversationId} label="Conversation ID" /></DescriptionItem>
                <DescriptionItem label="Provider Chat provenance" mono>{resource.providerChatId ?? 'Not reported'}</DescriptionItem>
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

        {resource && matchesConversation ? (
          <Panel headingLevel={3} title="Delivery receipts" description="Per-recipient projected receipts.">
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
  );
}
