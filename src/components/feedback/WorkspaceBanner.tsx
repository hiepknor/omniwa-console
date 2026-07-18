import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { useFeedback } from './FeedbackProvider';
import { SurfaceNotice } from './SurfaceNotice';

export function WorkspaceBanner() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const { transport } = useFeedback();
  if (transport.status === 'online' || location.pathname === '/overview') return null;

  return (
    <div className="workspace-banner">
      <SurfaceNotice
        kind="error"
        label="Connection"
        title="OmniWA API is unreachable"
        detail={transport.message}
        action={{ label: 'Retry active reads', run: () => { void queryClient.refetchQueries({ type: 'active' }); } }}
        announcement="polite"
      />
    </div>
  );
}
