// src/context/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, supabaseAuth } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

// 定义 Context 类型（贴合原有项目风格）
interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供 Auth Context
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 监听用户登录状态
  useEffect(() => {
    // 获取当前登录用户
    const getCurrentUser = async () => {
      setLoading(true);
      try {
        const { data: { user: currentUser } } = await supabaseAuth.getUser();
        setUser(currentUser);
      } catch (err) {
        setError('获取用户信息失败，请刷新页面');
        console.error('Auth error:', err);
      } finally {
        setLoading(false);
      }
    };

    // 实时监听 auth 状态变化
    const { data: { subscription } } = supabaseAuth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    getCurrentUser();
    return () => subscription.unsubscribe();
  }, []);

  // 清除错误提示
  const clearError = () => setError(null);

  // 登录逻辑（真实 Supabase 认证）
  const signIn = async (email: string, password: string) => {
    clearError();
    setLoading(true);
    try {
      const { error } = await supabaseAuth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } catch (err) {
      setError((err as Error).message || '登录失败，请检查账号密码');
      console.error('Sign in error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 注册逻辑（同步创建用户资料）
  const signUp = async (email: string, password: string, username: string) => {
    clearError();
    setLoading(true);
    try {
      // 1. 创建账号
      const { data: { user }, error: authError } = await supabaseAuth.signUp({ email, password });
      if (authError) throw new Error(authError.message);
      if (!user) throw new Error('注册失败，未创建用户');

      // 2. 同步创建用户资料（关联 profiles 表）
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: user.id, username });
      if (profileError) throw new Error('用户资料创建失败');
    } catch (err) {
      setError((err as Error).message || '注册失败，请重试');
      console.error('Sign up error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 退出登录
  const signOut = async () => {
    clearError();
    setLoading(true);
    try {
      const { error } = await supabaseAuth.signOut();
      if (error) throw new Error(error.message);
    } catch (err) {
      setError((err as Error).message || '退出登录失败');
      console.error('Sign out error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义 Hook 供组件使用
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
};
