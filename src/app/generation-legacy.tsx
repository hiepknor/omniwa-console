import { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';
import { ConnectPage } from './ConnectPage';
import { Shell } from './Shell';

const OverviewPage = lazy(() => import('@/features/overview/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const InstancesPage = lazy(() => import('@/features/instances/InstancesPage').then((module) => ({ default: module.InstancesPage })));
const ChatsPage = lazy(() => import('@/features/chats/ChatsPage').then((module) => ({ default: module.ChatsPage })));
const GroupsPage = lazy(() => import('@/features/groups/GroupsPage').then((module) => ({ default: module.GroupsPage })));
const CampaignsPage = lazy(() => import('@/features/campaigns/CampaignsPage').then((module) => ({ default: module.CampaignsPage })));
const QueuePage = lazy(() => import('@/features/queue/QueuePage').then((module) => ({ default: module.QueuePage })));
const WebhooksPage = lazy(() => import('@/features/webhooks/WebhooksPage').then((module) => ({ default: module.WebhooksPage })));
const EventsPage = lazy(() => import('@/features/events/EventsPage').then((module) => ({ default: module.EventsPage })));
const SettingsPage = lazy(() => import('@/features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const ApiKeysPage = lazy(() => import('@/features/api-keys/ApiKeysPage').then((module) => ({ default: module.ApiKeysPage })));

export const UI_GENERATION = 'legacy' as const;
export const ActiveConnectPage = ConnectPage;
export const ActiveShell = Shell;
export const authenticatedRoutes: RouteObject[] = [
  { path: '/chats', element: <ChatsPage /> },
  { path: '/chats/:instanceId', element: <ChatsPage /> },
  { path: '/chats/:instanceId/:chatId', element: <ChatsPage /> },
  { path: '/groups', element: <GroupsPage /> },
  { path: '/groups/:instanceId', element: <GroupsPage /> },
  { path: '/messages', element: <CampaignsPage /> },
  { path: '/messages/new', element: <CampaignsPage /> },
  { path: '/overview', element: <OverviewPage /> },
  { path: '/instances', element: <InstancesPage /> },
  { path: '/instances/:instanceId', element: <InstancesPage /> },
  { path: '/queue', element: <QueuePage /> },
  { path: '/webhooks', element: <WebhooksPage /> },
  { path: '/webhooks/:webhookId', element: <WebhooksPage /> },
  { path: '/events', element: <EventsPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/settings/api-keys', element: <ApiKeysPage /> },
  { path: '*', element: <Navigate to="/overview" replace /> },
];
