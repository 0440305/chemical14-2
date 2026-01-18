<<<<<<< HEAD
// src/components/PostCard.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types/db';
import CommentThread from './CommentThread';

interface PostCardProps {
  post: Post;
}

const PostCard = ({ post }: PostCardProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [authorName, setAuthorName] = useState('未知用户');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes);

  // 加载作者名称 + 检查是否已点赞
  useEffect(() => {
    const fetchAuthorAndLikeStatus = async () => {
      // 1. 获取作者名称
      const { data: authorData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', post.author_id)
        .single();
      if (authorData) setAuthorName(authorData.username);

      // 2. 检查当前用户是否点赞
      if (user) {
        const { data: likeData } = await supabase
          .from('post_likes')
          .select('*')
          .eq('post_id', post.id)
          .eq('user_id', user.id)
          .single();
        setIsLiked(!!likeData);
      }
    };
    fetchAuthorAndLikeStatus();
  }, [post.id, post.author_id, user]);

  // 点赞/取消点赞逻辑
  const handleLike = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    setLoading(true);
    try {
      if (isLiked) {
        // 取消点赞
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);
        if (error) throw error;
        setLikesCount(likesCount - 1);
        setIsLiked(false);
      } else {
        // 点赞
        const { error } = await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });
        if (error) throw error;
        setLikesCount(likesCount + 1);
        setIsLiked(true);
      }
    } catch (err) {
      console.error('Like error:', err);
      alert('点赞操作失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化时间
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  return (
    <div className="border rounded-lg p-4 mb-4 shadow-sm">
      <h3 className="text-xl font-bold mb-2">{post.title}</h3>
      <div className="text-sm text-gray-500 mb-2">
        <span>作者：{authorName}</span> | 
        <span> 分类：{post.category}</span> | 
        <span> 发布时间：{formatDate(post.created_at)}</span>
      </div>
      <p className="mb-4 text-gray-700">{post.content}</p>
      <div className="flex items-center mb-4">
        <button
          onClick={handleLike}
          className="flex items-center gap-1 text-red-500 disabled:opacity-50"
          disabled={loading}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              clipRule="evenodd"
            />
          </svg>
          <span>{likesCount}</span>
        </button>
      </div>
      {/* 评论区 */}
      <CommentThread postId={post.id} />
    </div>
  );
};

export default PostCard;
=======
import { MessageSquare, ArrowBigUp, Trash2 } from 'lucide-react';
import { Post } from '../types';
import { useAuth } from '../context/AuthContext';

interface PostCardProps {
  post: Post;
  onClick: () => void;
  onUpvote: () => void;
}

export default function PostCard({ post, onClick, onUpvote }: PostCardProps) {
  const { user, isAdmin, deletePost } = useAuth();
  const hasUpvoted = user ? post.upvotedBy.includes(user.username) : false;

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      onUpvote();
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(post.id);
    }
  };

  return (
    <div 
      className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="px-2 py-1 bg-gray-100 rounded-full">{post.category}</span>
            <span>•</span>
            <span>Posted by {post.author}</span>
            <span>•</span>
            <span>{post.createdAt}</span>
          </div>
          
          {isAdmin && (
            <button
              onClick={handleDelete}
              className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
              title="Delete post"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          {post.title}
        </h3>
        
        <p className="mt-2 text-gray-600 line-clamp-2">
          {post.content}
        </p>
        
        <div className="mt-4 flex items-center space-x-4">
          <button 
            className={`flex items-center space-x-1 ${
              !user ? 'opacity-50 cursor-not-allowed' :
              hasUpvoted ? 'text-blue-600' : 'text-gray-500 hover:text-blue-600'
            }`}
            onClick={handleUpvote}
            title={user ? 'Upvote' : 'Sign in to upvote'}
            disabled={!user}
          >
            <ArrowBigUp className={`h-5 w-5 ${hasUpvoted ? 'fill-current' : ''}`} />
            <span>{post.upvotes}</span>
          </button>
          
          <button 
            className="flex items-center space-x-1 text-gray-500 hover:text-blue-600"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <MessageSquare className="h-5 w-5" />
            <span>{post.commentCount} comments</span>
          </button>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 9d716b421daa11b66ba15186558b80f0cc759ebd
