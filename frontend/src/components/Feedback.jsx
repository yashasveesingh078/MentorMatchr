// Small reusable pieces for loading, errors and empty lists.
import { LoaderCircle, CircleAlert, Inbox } from 'lucide-react';

export function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading">
      <LoaderCircle size={18} className="spinner" />
      {text}
    </div>
  );
}

export function ErrorMessage({ message }) {
  if (!message) return null;
  return (
    <div className="alert alert-error">
      <CircleAlert size={16} />
      {message}
    </div>
  );
}

export function EmptyState({ title, text, icon: Icon = Inbox }) {
  return (
    <div className="empty">
      <Icon size={32} />
      <strong>{title}</strong>
      {text && <div>{text}</div>}
    </div>
  );
}