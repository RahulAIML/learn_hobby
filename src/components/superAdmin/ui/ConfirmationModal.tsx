import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 flex items-center justify-center p-4 z-50" onClick={onCancel}>
      <div className="bg-white rounded-lg max-w-sm w-full p-5" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 ${destructive ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'}`}>
            <AlertTriangle className={`w-4 h-4 ${destructive ? 'text-red-600' : 'text-amber-600'}`} />
          </div>
          <button type="button" onClick={onCancel} aria-label="Close" className="p-1 rounded hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mt-3">{title}</h3>
        <p className="text-xs text-slate-500 mt-1.5">{description}</p>
        <div className="flex items-center gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 rounded-md text-xs font-semibold border border-slate-200 text-slate-600 hover:border-slate-300 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-md text-xs font-semibold text-white transition-colors ${destructive ? 'bg-red-700 hover:bg-red-800' : 'bg-slate-900 hover:bg-slate-800'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
