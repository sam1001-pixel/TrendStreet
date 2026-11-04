"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { lockScroll } from "@/lib/scroll-lock";
import { useSwipeToClose } from "@/hooks/useSwipeToClose";

/** Bottom sheet on phones, centred dialog on larger screens. Closes on Esc, backdrop tap or a downward flick. */
export function Sheet({ title, onClose, children, footer }: { title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode }) {
  const panel = useRef<HTMLDivElement>(null);
  useSwipeToClose(panel, { direction: "down", onClose });

  useEffect(() => {
    const release = lockScroll();
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      release();
      window.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-espresso/50 backdrop-blur-[2px] animate-in fade-in duration-200" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl outline-none animate-in slide-in-from-bottom-8 duration-300 sm:max-w-lg sm:rounded-3xl"
      >
        <div className="mx-auto mt-2.5 h-1 w-10 flex-shrink-0 rounded-full bg-espresso/20 sm:hidden" aria-hidden />
        <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3">
          <h2 className="font-serif text-lg font-bold text-espresso">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-2 flex h-11 w-11 items-center justify-center rounded-full text-espresso/60 hover:bg-espresso/5 hover:text-espresso">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && <div className="border-t border-burgundy/10 bg-white px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
