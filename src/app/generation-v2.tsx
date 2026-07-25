import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { ConnectPageV2 } from './ConnectPageV2';
import { ShellV2 } from './ShellV2';

const OverviewPage = lazy(() => import('@/features/platform-v2/OverviewPageV2').then((module) => ({ default: module.OverviewPageV2 })));
const RecoveryPage = lazy(() => import('@/features/platform-v2/RecoveryPageV2').then((module) => ({ default: module.RecoveryPageV2 })));
const InstancesPage = lazy(() => import('@/features/instances-v2/InstancesPageV2').then((module) => ({ default: module.InstancesPageV2 })));
const ConversationsPage = lazy(() => import('@/features/conversations-v2/ConversationsPageV2').then((module) => ({ default: module.ConversationsPageV2 })));
const GroupsPage = lazy(() => import('@/features/groups-v2/GroupsPageV2').then((module) => ({ default: module.GroupsPageV2 })));
const CampaignsPage = lazy(() => import('@/features/campaigns-v2/CampaignsPageV2').then((module) => ({ default: module.CampaignsPageV2 })));
const CreateCampaignPage = lazy(() => import('@/features/campaigns-v2/CreateCampaignV2').then((module) => ({ default: module.CreateCampaignV2 })));
const EventsPage = lazy(() => import('@/features/events-v2/EventsPageV2').then((module) => ({ default: module.EventsPageV2 })));

export const UI_GENERATION = 'v2' as const;
export const ActiveConnectPage = ConnectPageV2;
export const ActiveShell = ShellV2;
export const authenticatedRoutes: RouteObject[] = [
  { path: '/chats', element: <ConversationsPage /> },
  { path: '/chats/:chatId', element: <ConversationsPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/groups/:groupId', element: <GroupsPage /> },
  { path: '/messages', element: <CampaignsPage /> },
  { path: '/messages/new', element: <CreateCampaignPage /> },
  { path: '/messages/:campaignId', element: <CampaignsPage /> },
  { path: '/overview', element: <OverviewPage /> },
  { path: '/recovery', element: <RecoveryPage /> },
  { path: '/instances', element: <InstancesPage /> },
  { path: '/instances/:instanceId', element: <InstancesPage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '*', element: <Navigate to="/overview" replace /> },
];
