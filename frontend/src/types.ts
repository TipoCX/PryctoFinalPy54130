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

export interface Message {
  id: number;
  sender: User;
  reciver: User;
  time: string;
  content: string;
}
