import { useLocation, useNavigate } from 'react-router-dom';
import { Tabs } from '@/ui';

export function GroupSectionTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const active = location.pathname.startsWith('/groups/lists') ? 'lists' : 'groups';
  return <Tabs active={active} onChange={(value) => navigate(value === 'lists' ? '/groups/lists' : '/groups')} tabs={[{ id: 'groups', label: 'Groups' }, { id: 'lists', label: 'Group Lists' }]} />;
}
