import type { ChatResource } from '@/api/chats';
import type { ContactResource } from '@/api/contacts';
import type { LabelResource } from '@/api/labels';
import { humanizeToken, relativeTime } from '@/lib/format';
import { Drawer, Panel, StateNotice, Status, type Tone } from '@/ui';
import { useMessage, useReceipts } from './hooks';
import { FailureNotice, ProjectionStatus } from './ui';

function Fact({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-line last:border-b-0">
      <dt className="text-xs text-fg-3">{label}</dt>
      <dd className={mono ? 'font-mono text-xs text-fg' : 'text-[13px] text-fg'}>{value}</dd>
    </div>
  );
}

function receiptTone(type: string): Tone {
  return type === 'read' || type === 'delivered' ? 'ok' : 'pending';
}

export function DirectoryInspector({ contact, label, error, loading, onRetry, onClose }: { contact?: ContactResource; label?: LabelResource; error?: unknown; loading: boolean; onRetry: () => void; onClose: () => void }) {
  const title = contact?.displayName ?? label?.name ?? (contact ? contact.id : label?.id) ?? 'Directory details';
  return (
    <Drawer open onClose={onClose} title={title} subtitle={contact ? 'Projected contact' : 'Projected label'}>
      {loading ? (
        <StateNotice kind="loading" title="Loading" />
      ) : error && !contact && !label ? (
        <FailureNotice error={error} onRetry={onRetry} />
      ) : contact ? (
        <Panel title="Normalized identity" description="Read-only projection; phone identity is redacted by the backend." bodyClassName="pt-2">
          <dl>
            <Fact label="JID" value={contact.id} mono />
            <Fact label="Username" value={contact.username ?? 'Not reported'} />
            <Fact label="Phone" value={contact.redactedPhone ?? 'Not reported'} />
            <Fact label="Business" value={contact.businessName ?? 'Not reported'} />
            <Fact label="About" value={contact.about ?? 'Not reported'} />
            <Fact label="Known" value={contact.found ? 'Yes' : 'No'} />
          </dl>
        </Panel>
      ) : label ? (
        <Panel title="Projected definition" description="Definitions are read-only; Console does not infer chat-label assignments." bodyClassName="pt-2">
          <dl>
            <Fact label="Label ID" value={label.id} mono />
            <Fact label="Name" value={label.name ?? 'Not reported'} />
            <Fact label="Color" value={label.color ?? 'Not reported'} />
            <Fact label="Predefined ID" value={label.predefinedId ?? 'Not reported'} />
          </dl>
        </Panel>
      ) : (
        <StateNotice kind="empty" title="Not found" detail="The selected projected definition was not returned." />
      )}
    </Drawer>
  );
}

export function MessageInspector({ messageId, loadedChat, enabled, onClose }: { messageId: string; loadedChat?: ChatResource; enabled: boolean; onClose: () => void }) {
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
            <ProjectionStatus meta={message.data?.meta} />
            <Panel title="Message facts" description="Projected status is authoritative; command acknowledgement is not delivery." bodyClassName="pt-2">
              <dl>
                <Fact label="Chat" value={resource.chatId} mono />
                <Fact label="Direction" value={humanizeToken(resource.direction)} />
                <Fact label="Type" value={humanizeToken(resource.type)} />
                <Fact label="Provenance" value={humanizeToken(resource.provenance)} />
                <Fact label="Created" value={relativeTime(resource.createdAt) || resource.createdAt} />
                <Fact label="Delivered" value={resource.deliveredAt ? (relativeTime(resource.deliveredAt) || 'Not reported') : 'Not reported'} />
                <Fact label="Read" value={resource.readAt ? (relativeTime(resource.readAt) || 'Not reported') : 'Not reported'} />
              </dl>
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
              receipts.data.resource.length ? (
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
              )
            ) : null}
          </Panel>
        ) : null}
      </div>
    </Drawer>
  );
}
