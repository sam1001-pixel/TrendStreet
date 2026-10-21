"use client";

import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

/** Live-region banner for admin save results, so failures are never silent. */
export function AdminStatusBar({
  loading,
  error,
  notice,
  onDismiss,
}: {
  loading?: boolean;
  error: string | null;
  notice: string | null;
  onDismiss: () => void;
}) {
  return (
    <div aria-live="polite" className="space-y-2">
      {loading && (
        <p className="flex items-center gap-2 text-xs text-espresso/60">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading from database…
        </p>
      )}
      {error && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800">
          <span className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {error}
          </span>
          <button onClick={onDismiss} aria-label="Dismiss" className="rounded p-0.5 hover:bg-red-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
      {notice && (
        <p className="flex items-center gap-2 rounded-xl border border-green-300 bg-green-50 p-3 text-xs text-green-800">
          <CheckCircle2 className="h-4 w-4" /> {notice}
        </p>
      )}
    </div>
  );
}
