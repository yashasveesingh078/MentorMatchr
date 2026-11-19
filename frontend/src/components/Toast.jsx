import { useEffect } from 'react';
import { CircleCheck, X } from 'lucide-react';

// A short success message in the corner that hides itself after 4 seconds.
export default function Toast({ message, onClose }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer); // stop the timer if the message changes
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="toast" role="status">
      <CircleCheck size={18} />
      <span>{message}</span>
      <button className="btn-ghost" onClick={onClose} aria-label="Close">
        <X size={16} />
      </button>
    </div>
  );
}