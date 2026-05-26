export interface IConversation {
  _id: string;
  clientId: string;
  trainerId: string;
  planId: string;
  clientName: string;
  trainerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  isActive: boolean;
  trainerInfo?: {
    name: string;
    profilePhotoUrl: string;
  } | null;
  clientUnread?: number;
  trainerUnread?: number;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string;
  senderRole: 'client' | 'trainer';
  content: string;
  type: 'text' | 'image' | 'file' | 'system' | 'phone_request' | 'phone_response';
  fileUrl?: string;
  fileName?: string;
  seen: boolean;
  createdAt: string;
}
