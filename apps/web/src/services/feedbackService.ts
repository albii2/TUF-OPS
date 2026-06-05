export type FeedbackTone = 'success' | 'error' | 'info';

export type FeedbackMessage = {
  tone: FeedbackTone;
  message: string;
};

const QUEUE_KEY = 'tuf_ops_feedback_queue_v1';
export const FEEDBACK_EVENT = 'tuf:feedback';

export function notify(message: string, tone: FeedbackTone = 'success') {
  const payload: FeedbackMessage = { message, tone };
  sessionStorage.setItem(QUEUE_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent<FeedbackMessage>(FEEDBACK_EVENT, { detail: payload }));
}

export function consumeQueuedFeedback(): FeedbackMessage | null {
  const raw = sessionStorage.getItem(QUEUE_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(QUEUE_KEY);
  try {
    return JSON.parse(raw) as FeedbackMessage;
  } catch {
    return null;
  }
}
