import { FeedbackContent } from './FeedbackContent';
import type { FeedbackAction, FeedbackKind } from './feedback-types';

export function SurfaceNotice({
  kind,
  label,
  title,
  detail,
  requestId,
  action,
  className,
  announcement = false,
}: {
  kind: FeedbackKind;
  label?: string;
  title: string;
  detail?: string;
  requestId?: string;
  action?: FeedbackAction;
  className?: string;
  announcement?: false | 'polite' | 'assertive';
}) {
  return (
    <div
      className={`feedback-notice feedback-tone-${kind}${className ? ` ${className}` : ''}`}
      role={announcement === 'assertive' ? 'alert' : announcement === 'polite' ? 'status' : undefined}
    >
      <FeedbackContent
        kind={kind}
        label={label}
        title={title}
        detail={detail}
        requestId={requestId}
        action={action}
      />
    </div>
  );
}
