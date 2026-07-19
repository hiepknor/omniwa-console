import { useRealtimeStatusOrNull } from '@/api/RealtimeProvider';
import { useFeedback } from '@/components/feedback/FeedbackProvider';

type IndicatorState = 'live' | 'reconnecting' | 'polling' | 'offline';

const indicatorCopy: Record<IndicatorState, { label: string; compactLabel: string; title: string; dotClass: string }> = {
  live: {
    label: 'Event stream live',
    compactLabel: 'Live',
    title: 'Realtime event stream is connected.',
    dotClass: 'dot-ok',
  },
  reconnecting: {
    label: 'Event stream reconnecting',
    compactLabel: 'Reconnecting',
    title: 'Realtime stream interrupted; reconnecting.',
    dotClass: 'dot-pending',
  },
  polling: {
    label: 'Polling',
    compactLabel: 'Polling',
    title: 'Realtime stream unavailable; data refreshes every 15 seconds.',
    dotClass: 'dot-info',
  },
  offline: {
    label: 'Offline',
    compactLabel: 'Offline',
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
      <span className="max-[640px]:!hidden">{copy.label}</span>
      <span className="!hidden max-[640px]:!inline">{copy.compactLabel}</span>
    </span>
  );
}

export function PollingIndicator(): JSX.Element {
  const { transport } = useFeedback();
  const offline = transport.status === 'offline';

  return (
    <span className="live" data-state={offline ? 'offline' : 'polling'} title={offline ? 'Platform unreachable.' : 'Page data refreshes every 15 seconds.'}>
      <span className={`dot ${offline ? 'dot-failed' : 'dot-info'}`} />
      {offline ? 'Offline' : 'Polling'}
    </span>
  );
}
