// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient, SupabaseAuthClient } from '@supabase/supabase-js';

// 从环境变量读取（Netlify 配置的 VITE_ 前缀变量会被 Vite 暴露）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// 校验环境变量（开发环境提示，生产环境可注释）
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase 环境变量未配置！请检查 Netlify 或本地 .env 文件');
}

// 初始化 Supabase 客户端
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

// 导出 Auth 客户端（方便单独使用认证功能）
export const supabaseAuth: SupabaseAuthClient = supabase.auth;