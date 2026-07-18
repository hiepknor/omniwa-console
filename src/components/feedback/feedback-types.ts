export type FeedbackKind = 'accepted' | 'completed' | 'info' | 'warning' | 'error';

export type FeedbackAction = {
  label: string;
  run: () => void;
};

export type FeedbackInput = {
  kind: FeedbackKind;
  title: string;
  detail?: string;
  requestId?: string;
  dedupeKey?: string;
  action?: FeedbackAction;
  durationMs?: number;
};

export type FeedbackToast = FeedbackInput & {
  id: string;
  createdAt: number;
};

export type TransportCondition =
  | { status: 'online' }
  | { status: 'offline'; message: string };
