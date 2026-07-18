import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  invalidationKeysFor,
  openEventStream,
  type NormalizedRealtimeEvent,
} from './events';
import { realtimeGapKeys } from './keys';

export type RealtimeConnectionState = 'connecting' | 'live' | 'reconnecting' | 'polling';

export const REALTIME_REFETCH_INTERVAL = 15_000;

const EVENT_CAPACITY = 200;

type Listener = () => void;

class RealtimeStore {
  private status: RealtimeConnectionState = 'connecting';
  private events: readonly NormalizedRealtimeEvent[] = [];
  private readonly seenEventIds = new Set<string>();
  private readonly statusListeners = new Set<Listener>();
  private readonly eventListeners = new Set<Listener>();

  readonly subscribeStatus = (listener: Listener) => {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  };

  readonly getStatus = () => this.status;

  readonly subscribeEvents = (listener: Listener) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  readonly getEvents = () => this.events;

  reset() {
    this.setStatus('connecting');
    this.seenEventIds.clear();
    if (this.events.length === 0) return;
    this.events = [];
    this.eventListeners.forEach((listener) => listener());
  }

  setStatus(status: RealtimeConnectionState) {
    if (this.status === status) return;
    this.status = status;
    this.statusListeners.forEach((listener) => listener());
  }

  pushEvents(events: readonly NormalizedRealtimeEvent[]) {
    const added: NormalizedRealtimeEvent[] = [];

    for (const event of events) {
      if (this.seenEventIds.has(event.id)) continue;
      this.seenEventIds.add(event.id);
      added.push(event);
    }

    if (added.length === 0) return;
    this.events = [...added.reverse(), ...this.events].slice(0, EVENT_CAPACITY);
    this.eventListeners.forEach((listener) => listener());
  }
}

const RealtimeContext = createContext<RealtimeStore | null>(null);

export function RealtimeProvider(props: {
  session: { baseUrl: string; apiKey: string };
  onAuthError: () => void;
  children: ReactNode;
}): JSX.Element {
  const { session, onAuthError, children } = props;
  const queryClient = useQueryClient();
  const storeRef = useRef<RealtimeStore | null>(null);
  const authErrorRef = useRef(onAuthError);
  if (storeRef.current === null) storeRef.current = new RealtimeStore();
  const store = storeRef.current;
  authErrorRef.current = onAuthError;

  useEffect(() => {
    store.reset();
    const handle = openEventStream({
      baseUrl: session.baseUrl,
      apiKey: session.apiKey,
      onBatch: (batch) => {
        store.pushEvents(batch.events);

        if (!batch.isBackfill && batch.events.length > 0) {
          for (const queryKey of invalidationKeysFor(batch.events)) {
            void queryClient.invalidateQueries({ queryKey });
          }
        }

        if (batch.isGap) {
          for (const queryKey of realtimeGapKeys) {
            void queryClient.invalidateQueries({ queryKey });
          }
        }
      },
      onStatus: (status) => store.setStatus(status),
      onAuthError: () => authErrorRef.current(),
      isPaused: () => document.visibilityState === 'hidden',
    });

    return () => handle.close();
  }, [session.baseUrl, session.apiKey]);

  return <RealtimeContext.Provider value={store}>{children}</RealtimeContext.Provider>;
}

function useRealtimeStore(hookName: string): RealtimeStore {
  const store = useContext(RealtimeContext);
  if (store === null) {
    throw new Error(`${hookName} must be used within a RealtimeProvider.`);
  }
  return store;
}

export function useRealtimeStatus(): RealtimeConnectionState {
  const store = useRealtimeStore('useRealtimeStatus');
  return useSyncExternalStore(store.subscribeStatus, store.getStatus, store.getStatus);
}

export function useRealtimeEvents(): readonly NormalizedRealtimeEvent[] {
  const store = useRealtimeStore('useRealtimeEvents');
  return useSyncExternalStore(store.subscribeEvents, store.getEvents, store.getEvents);
}

export function useRealtimeRefetchInterval(): number | false {
  return useRealtimeStatus() === 'live' ? false : REALTIME_REFETCH_INTERVAL;
}

const subscribeToNothing = () => () => undefined;
const getNullStatus = () => null;

/** Null-safe variant for shared components that may render outside the provider. */
export function useRealtimeStatusOrNull(): RealtimeConnectionState | null {
  const store = useContext(RealtimeContext);
  return useSyncExternalStore(
    store?.subscribeStatus ?? subscribeToNothing,
    store?.getStatus ?? getNullStatus,
    store?.getStatus ?? getNullStatus,
  );
}
