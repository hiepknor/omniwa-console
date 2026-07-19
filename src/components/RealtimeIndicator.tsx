import { useRealtimeStatusOrNull } from '@/api/RealtimeProvider';
import { useFeedback } from '@/components/feedback/FeedbackProvider';

type IndicatorState = 'live' | 'reconnecting' | 'polling' | 'offline';

const indicatorCopy: Record<IndicatorState, { label: string; title: string; dotClass: string }> = {
  live: {
    label: 'Event stream live',
    title: 'Realtime event stream is connected.',
    dotClass: 'dot-ok',
  },
  reconnecting: {
    label: 'Event stream reconnecting',
    title: 'Realtime stream interrupted; reconnecting.',
    dotClass: 'dot-pending',
  },
  polling: {
    label: 'Polling',
    title: 'Realtime stream unavailable; data refreshes every 15 seconds.',
    dotClass: 'dot-info',
  },
  offline: {
    label: 'Offline',
    title: 'Platform unreachable.',
    dotClass: 'dot-failed',
  },
};

export function RealtimeIndicator(): JSX.Element | null {
  const status = useRealtimeStatusOrNull();
  const { transport } = useFeedback();

  if (status === null) return null;

  const state: IndicatorState = transport.status === 'offline'
    ? 'offline'
    : status === 'live' || status === 'polling'
      ? status
      : 'reconnecting';
  const copy = indicatorCopy[state];

  return (
    <span className="live" data-state={state} title={copy.title}>
      <span className={`dot ${copy.dotClass}`} />
      {copy.label}
    </span>
  );
}
