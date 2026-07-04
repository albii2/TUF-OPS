import React, { useState } from 'react';
import { getApiBaseUrl } from '../../services/apiBaseUrl';

interface TrainingFrictionPanelProps {
  enrollmentId: number | string;
  moduleId?: number;
  onSuccess?: () => void;
}

export default function TrainingFrictionPanel({
  enrollmentId,
  moduleId,
  onSuccess,
}: TrainingFrictionPanelProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/training/friction-point`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            enrollmentId,
            frictionPointText: text.trim(),
            moduleId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to record friction point');
      }

      setText('');
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-slate-800 bg-slate-900/60 backdrop-blur-md rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
          Report System Friction
        </h3>
        <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Combine Ops</span>
      </div>
      
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">
        Ran into a bottleneck, slow tool response, or unclear prompt? Log it here to notify your State Director instantly.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (success) setSuccess(false);
          }}
          placeholder="Describe the friction or issue you encountered..."
          className="w-full h-20 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-orange-500/80 transition-colors resize-none"
          disabled={loading}
        />

        {error && (
          <div className="text-xs font-semibold text-red-400 bg-red-950/20 border border-red-500/30 rounded px-2.5 py-1.5">
            Error: {error}
          </div>
        )}

        {success && (
          <div className="text-xs font-bold text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 rounded px-2.5 py-1.5 flex items-center gap-2">
            <span>✓</span> Friction point recorded. Thank you for the report!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="w-full py-2 px-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(249,115,22,0.15)] hover:shadow-[0_0_16px_rgba(249,115,22,0.25)]"
        >
          {loading ? 'Submitting...' : 'Log Friction Point'}
        </button>
      </form>
    </div>
  );
}
