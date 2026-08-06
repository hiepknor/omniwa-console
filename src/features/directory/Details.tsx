import type { ContactResource } from '@/api/contacts';
import type { ProjectionMeta } from '@/api/envelopes';
import type { LabelResource } from '@/api/labels';
import { humanizeToken, relativeTime } from '@/lib/format';
import { ProjectionFailureNotice as FailureNotice, ProjectionStatus } from '@/components/ProjectionReadState';
import { CopyValue, DescriptionItem, DescriptionList, Panel, StateNotice } from '@/ui';

export function DirectoryDetails({ contact, label, meta, error, loading, onRetry }: { contact?: ContactResource; label?: LabelResource; meta?: ProjectionMeta; error?: unknown; loading: boolean; onRetry: () => void }) {
  if (loading) return <StateNotice kind="loading" title="Loading details" />;
  if (error && !contact && !label) return <FailureNotice error={error} onRetry={onRetry} />;
  if (contact) return (
    <div className="grid gap-4">
      {error ? <FailureNotice error={error} stale onRetry={onRetry} /> : null}
      <ProjectionStatus meta={meta} />
      <Panel headingLevel={3} title={contact.identityStatus === 'legacy' ? 'Normalized identity' : 'Canonical identity'} description={contact.identityStatus === 'legacy' ? 'Compatibility projection fields; canonical reconciliation is not active for this instance.' : 'The backend owns reconciliation. Aliases are lookup material, not separate contacts.'} bodyPadding="compact-top">
        <DescriptionList>
          <DescriptionItem label="Contact ID" mono><CopyValue value={contact.id} label="Contact ID" /></DescriptionItem>
          <DescriptionItem label="Addressing JID" mono>{contact.addressingJid ? <CopyValue value={contact.addressingJid} label="Addressing JID" /> : 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Identity status">{humanizeToken(contact.identityStatus)}</DescriptionItem>
          <DescriptionItem label="Identity updated">{contact.identityUpdatedAt ? relativeTime(contact.identityUpdatedAt) || contact.identityUpdatedAt : 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Display source">{contact.displayNameSource ? humanizeToken(contact.displayNameSource) : 'Compatibility projection'}</DescriptionItem>
          <DescriptionItem label="Aliases" mono>{contact.aliases.length ? <CopyValue value={contact.aliases.join(', ')} label="Contact aliases" /> : 'None reported'}</DescriptionItem>
          <DescriptionItem label="Username">{contact.username ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Phone" mono>{contact.phoneNumber ? <CopyValue value={contact.phoneNumber} label="Phone number" /> : contact.redactedPhone ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Business">{contact.businessName ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="About">{contact.about ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="WhatsApp contact found">{contact.found === undefined ? 'Not reported' : contact.found ? 'Yes' : 'No'}</DescriptionItem>
        </DescriptionList>
      </Panel>
      <Panel headingLevel={3} title="Labels" description="Projected label definitions are available from the page-level catalog.">
        <StateNotice kind="empty" title="Associations unavailable" detail="The backend does not report authoritative Contact–Label associations. The Console does not infer assignments from provider identifiers." />
      </Panel>
    </div>
  );
  if (label) return (
    <div className="grid gap-4">
      {error ? <FailureNotice error={error} stale onRetry={onRetry} /> : null}
      <ProjectionStatus meta={meta} />
      <Panel headingLevel={3} title="Projected definition" description="Definitions are read-only; Console does not infer Conversation or Message assignments." bodyPadding="compact-top">
        <DescriptionList>
          <DescriptionItem label="Label ID" mono><CopyValue value={label.id} label="Label ID" /></DescriptionItem>
          <DescriptionItem label="Name">{label.name ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Color">{label.color ?? 'Not reported'}</DescriptionItem>
          <DescriptionItem label="Predefined ID">{label.predefinedId ?? 'Not reported'}</DescriptionItem>
        </DescriptionList>
      </Panel>
    </div>
  );
  return <StateNotice kind="empty" title="Not returned" detail="The selected projected resource was not returned." />;
}
