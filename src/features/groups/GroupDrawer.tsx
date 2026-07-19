import { useEffect } from 'react';

export function GroupDrawer({ groupId, subject, onClose }: {
  groupId: string;
  subject: string | undefined;
  onClose: () => void;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return (
    <aside className="drawer groups-drawer" aria-label="Group details">
      <header className="drawer-head">
        <div className="drawer-identity">
          <span className="eyebrow">Group detail</span>
          <div className="drawer-title-row"><h2>{subject ?? 'Group details'}</h2></div>
          <span className="mono">{groupId}</span>
        </div>
        <button className="close" type="button" aria-label="Close group details" onClick={onClose}>✕</button>
      </header>
      <div className="drawer-scroll">
        <div className="empty groups-drawer-placeholder">
          <p>Group detail arrives with management controls.</p>
        </div>
      </div>
    </aside>
  );
}
