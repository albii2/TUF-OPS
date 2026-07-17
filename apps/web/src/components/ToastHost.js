import { useEffect, useState } from 'react';
import { consumeQueuedFeedback, FEEDBACK_EVENT } from '../services/feedbackService';
const toneClass = {
    success: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100',
    error: 'border-rose-400/60 bg-rose-500/15 text-rose-100',
    info: 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100',
};
export function ToastHost() {
    const [feedback, setFeedback] = useState(() => consumeQueuedFeedback());
    useEffect(() => {
        const onFeedback = (event) => {
            const detail = event.detail;
            if (detail)
                setFeedback(detail);
        };
        window.addEventListener(FEEDBACK_EVENT, onFeedback);
        return () => window.removeEventListener(FEEDBACK_EVENT, onFeedback);
    }, []);
    useEffect(() => {
        if (!feedback)
            return;
        const timer = window.setTimeout(() => setFeedback(null), 5000);
        return () => window.clearTimeout(timer);
    }, [feedback]);
    if (!feedback)
        return null;
    return (<div className="fixed right-4 top-4 z-50 max-w-sm">
      <div className={`rounded-lg border px-4 py-3 text-sm shadow-[0_16px_50px_rgba(0,0,0,0.35)] backdrop-blur ${toneClass[feedback.tone]}`}>
        {feedback.message}
      </div>
    </div>);
}
//# sourceMappingURL=ToastHost.js.map