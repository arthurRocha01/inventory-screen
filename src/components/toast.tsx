import * as React from "react";
import { X } from "lucide-react";

export interface ToastProps {
  message: string;
  onClose: () => void;
}

export const Toast = ({ message, onClose }: ToastProps) => {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
      <div className="bg-slate-900 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button
          onClick={onClose}
          className="hover:bg-slate-800 rounded p-1 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
