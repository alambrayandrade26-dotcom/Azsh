export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system',
}

export enum StatusType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status?: string;
  phone?: string;
  lastSeen?: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'me' or contactId
  type: MessageType;
  content: string;
  timestamp: number;
  isRead: boolean;
  reactions?: string[];
  isForwarded?: boolean;
}

export interface Chat {
  id: string;
  contactId: string;
  lastMessage?: Message;
}

export interface Status {
  id: string;
  creatorId: string; // 'me' or contactId
  type: StatusType;
  content: string;
  backgroundColor?: string;
  font?: string;
  timestamp: number;
  expiresAt: number;
  viewers: string[]; // ids of contacts who viewed
}
