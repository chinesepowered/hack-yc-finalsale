"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { CloseIcon } from "./icons";

/** Native modal dialog: focus moves in, Escape closes, focus returns to the opener. */
export function Dialog({
  open,
  onClose,
  title,
  children,
  wide,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
  testId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      aria-labelledby={`${testId ?? "dlg"}-title`}
      className={`m-auto max-h-[92dvh] w-[calc(100%-24px)] ${wide ? "max-w-[860px]" : "max-w-[560px]"} overflow-hidden rounded-[20px] border border-line bg-card p-0 text-ink shadow-2xl`}
      data-testid={testId}
    >
      {open && (
        <div className="flex max-h-[92dvh] flex-col">
          <div className="flex items-center gap-3 border-b border-line px-5 py-4">
            <h2 id={`${testId ?? "dlg"}-title`} className="font-display text-[21px] font-semibold">
              {title}
            </h2>
            <button type="button" onClick={onClose} className="ml-auto grid h-10 w-10 place-items-center rounded-full hover:bg-ink/5" aria-label="Close" data-testid={`${testId ?? "dlg"}-close`}>
              <CloseIcon />
            </button>
          </div>
          <div className="overflow-y-auto px-5 py-4">{children}</div>
        </div>
      )}
    </dialog>
  );
}
