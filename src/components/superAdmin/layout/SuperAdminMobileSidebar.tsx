'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { SuperAdminBrand, SuperAdminNav, SuperAdminFooter } from './SuperAdminSidebar';

interface MobileSidebarProps {
  activeKey: string;
  adminName: string;
  open: boolean;
  onClose: () => void;
}

/** Drawer navigation for `< lg` screens — same nav content as the desktop sidebar, different chrome. */
export const SuperAdminMobileSidebar: React.FC<MobileSidebarProps> = ({ activeKey, adminName, open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Close menu" onClick={onClose} className="absolute inset-0 bg-slate-950/50 motion-safe:animate-[fadeIn_150ms_ease-out]" />
      <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 flex flex-col motion-safe:animate-[slideIn_180ms_ease-out] shadow-xl">
        <div className="relative">
          <SuperAdminBrand />
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-md flex items-center justify-center text-slate-400 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <SuperAdminNav activeKey={activeKey} />
        <SuperAdminFooter adminName={adminName} />
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
