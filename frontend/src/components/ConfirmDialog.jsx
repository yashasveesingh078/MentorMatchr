// A small pop-up that asks "Are you sure?" before an important action.
export default function ConfirmDialog({ title, children, confirmText, busy, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={busy ? undefined : onCancel}>
      {/* stopPropagation: clicks inside the box should not close it */}
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy}>
            {busy ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}