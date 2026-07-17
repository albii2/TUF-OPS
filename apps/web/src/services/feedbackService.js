const QUEUE_KEY = 'tuf_ops_feedback_queue_v1';
export const FEEDBACK_EVENT = 'tuf:feedback';
export function notify(message, tone = 'success') {
    const payload = { message, tone };
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent(FEEDBACK_EVENT, { detail: payload }));
}
export function consumeQueuedFeedback() {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (!raw)
        return null;
    sessionStorage.removeItem(QUEUE_KEY);
    try {
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=feedbackService.js.map