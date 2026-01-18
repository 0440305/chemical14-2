// src/components/CommentThread.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Comment } from '../types/db';

interface CommentThreadProps {
  postId: string;
}

const CommentThread = ({ postId }: CommentThreadProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载评论列表
  const fetchComments = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles(username)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      setComments(data as Comment[]);
    } catch (err) {
      setError('加载评论失败');
      console.error('Fetch comments error:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // 监听评论变化（可选，实时更新）
    const subscription = supabase
      .channel(`comments:${postId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        () => fetchComments()
      )
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, [postId]);

  // 提交评论
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('请先登录');
      return;
    }
    if (!newComment.trim()) {
      setError('评论内容不能为空');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          content: newComment,
          author_id: user.id,
        });
      if (error) throw new Error(error.message);

      // 重置输入框 + 重新加载评论
      setNewComment('');
      await fetchComments();
    } catch (err) {
      setError((err as Error).message || '发布评论失败');
      console.error('Create comment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (fetching) return <div className="text-center py-2">加载评论中...</div>;

  return (
    <div className="mt-4 border-t pt-4">
      <h4 className="font-medium mb-2">评论区</h4>
      {/* 发布评论表单 */}
      <form onSubmit={handleSubmitComment} className="mb-4 space-y-2">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full p-2 border rounded text-sm"
          placeholder="写下你的评论..."
          disabled={loading || !user}
        />
        <button
          type="submit"
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:bg-gray-400"
          disabled={loading || !user}
        >
          {loading ? '发布中...' : '发布评论'}
        </button>
      </form>

      {/* 评论列表 */}
      {comments.length === 0 ? (
        <p className="text-gray-500 text-sm">暂无评论</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="p-2 bg-gray-50 rounded">
              <div className="text-xs text-gray-500 mb-1">
                <span>{comment.author?.username || '未知用户'}</span> | 
                <span> {formatDate(comment.created_at)}</span>
              </div>
              <p className="text-sm">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentThread;