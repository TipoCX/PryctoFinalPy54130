export interface User {
  id: number;
  username: string;
  email: string;
  date_joined?: string;
  post_count?: number;
  avatar_url?: string;
}

export interface Post {
  id: number;
  titulo: string;
  contenido: string;
  time: string;
  author: User;
  likes_count: number;
  has_liked: boolean;
  imagen?: string;
  imagen_borrada?: boolean;
}

export interface Conversation {
  id: number;
  participants: User[];
  updated_at: string;
  last_message?: {
    sender_id: number;
    content: string;
    time: string;
  };
}

export interface Message {
  id: number;
  conversation_id: number;
  sender: User;
  time: string;
  content: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
