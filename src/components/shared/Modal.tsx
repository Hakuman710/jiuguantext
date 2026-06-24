import { type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-cosmic-light rounded-xl border-2 border-amber-glow shadow-2xl w-full max-w-lg max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-parchment-dark/20">
          <h2 className="text-xl font-serif text-parchment">{title}</h2>
          <button onClick={onClose} className="text-parchment-dark hover:text-ember transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
