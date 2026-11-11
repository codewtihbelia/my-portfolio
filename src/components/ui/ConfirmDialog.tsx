import React from "react";
import { AlertTriangle } from "lucide-react";
import { Spinner } from "./Spinner";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  confirmText,
  cancelLabel = "Cancel",
  cancelText,
  isDestructive = true,
  isLoading = false,
  onConfirm,
  onCancel,
  onClose,
}) => {
  const handleCancel = onCancel || onClose || (() => {});
  const displayConfirm = confirmText || confirmLabel;
  const displayCancel = cancelText || cancelLabel;
  if (!isOpen) return null;

  return (
    <div
      id="confirm-dialog-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={isLoading ? undefined : handleCancel}
    >
      <div
        id="confirm-dialog-modal"
        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              isDestructive
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                : "bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400"
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="confirm-dialog-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
            >
              {title}
            </h3>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/60">
          <button
            type="button"
            id="confirm-dialog-cancel-btn"
            disabled={isLoading}
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {displayCancel}
          </button>
          <button
            type="button"
            id="confirm-dialog-confirm-btn"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer ${
              isDestructive
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800"
            }`}
          >
            {isLoading && <Spinner size="sm" />}
            <span>{displayConfirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
