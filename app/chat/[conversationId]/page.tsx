import React from 'react';
import ChatRoomClient from '@/components/chat/ChatRoomClient';

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const resolvedParams = await params;
  const conversationId = resolvedParams.conversationId;

  return <ChatRoomClient conversationId={conversationId} />;
}
