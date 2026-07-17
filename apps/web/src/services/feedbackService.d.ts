export type FeedbackTone = 'success' | 'error' | 'info';
export type FeedbackMessage = {
    tone: FeedbackTone;
    message: string;
};
export declare const FEEDBACK_EVENT = "tuf:feedback";
export declare function notify(message: string, tone?: FeedbackTone): void;
export declare function consumeQueuedFeedback(): FeedbackMessage | null;
//# sourceMappingURL=feedbackService.d.ts.map