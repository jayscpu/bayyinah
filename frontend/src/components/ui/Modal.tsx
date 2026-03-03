import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-charcoal-900/50" onClick={onClose} />
      <div className="relative bg-cream-50 rounded-sm shadow-lg max-w-lg w-full mx-4 p-6 decorative-border">
        {title && (
          <h2 className="font-serif text-xl text-charcoal-800 mb-4">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
