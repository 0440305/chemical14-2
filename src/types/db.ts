// src/types/db.ts
import type { User } from '@supabase/supabase-js';

// 帖子类型
export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: string;
  likes: number;
  created_at: string;
  author?: { username: string }; // 关联作者信息
  isLiked?: boolean; // 前端标记是否已点赞
}

// 评论类型
export interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  created_at: string;
  author?: { username: string };
}