import type { QueryClient } from '@tanstack/react-query';
import { queryKeys, SESSION_QUERY_SCOPE } from '@/api/keys';

/** A group text is also a chat/message event; refresh both projected views after acknowledgement. */
export async function invalidateGroupSendProjections(queryClient: QueryClient, groupId: string): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.instanceChats(SESSION_QUERY_SCOPE) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.instanceMessages(SESSION_QUERY_SCOPE, groupId) }),
  ]);
}
