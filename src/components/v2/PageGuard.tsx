import { PageHeader } from './primitives';
import { StateNotice } from './interaction';

/**
 * Full-page blocked state shown when a route cannot run: the session lacks the
 * required scope (`invalid`), capability discovery is in flight (`discovering`),
 * or the backend does not advertise the capability (`unsupported`). It renders
 * the page shell and header so a blocked route keeps its identity, and maps the
 * blocking reason to the session/capability state axis. Inline, in-content
 * notices keep using `StateNotice` directly.
 */
export function PageGuard({
  eyebrow,
  title,
  description,
  state,
  detail,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  state: 'invalid' | 'discovering' | 'unsupported';
  detail?: string;
}) {
  return (
    <div className="ui-v2-page">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="ui-v2-page__content">
        <StateNotice value={state === 'invalid' ? { axis: 'session', state } : { axis: 'capability', state }} detail={detail} />
      </div>
    </div>
  );
}
