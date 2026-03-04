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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(26, 26, 26, 0.45)',
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'relative',
          background: 'var(--color-cream-50)',
          width: '100%',
          maxWidth: '440px',
          margin: '0 1rem',
          padding: '2.5rem',
          borderTop: '2px solid var(--color-charcoal-800)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-warmgray-400)',
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '2px 6px',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-charcoal-800)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-warmgray-400)')}
        >
          ×
        </button>

        {/* Diamond ornament */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <img src="/assets/diamond.png" alt="" style={{ height: '1.75rem', display: 'inline-block' }} />
        </div>

        {/* Title */}
        {title && (
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            fontWeight: 500,
            color: 'var(--color-charcoal-800)',
            textAlign: 'center',
            marginBottom: '1.75rem',
            letterSpacing: '0.01em',
          }}>
            {title}
          </h2>
        )}

        {children}
      </div>
    </div>
  );
}
