import React, { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserAvatar } from "@/components/UserAvatar";
import { Heart, MessageCircle, Send, Image, Clock, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";
import { useAuth } from "@/hooks/useAuth";

interface PostWithDetails {
  id: string;
  content?: string;
  imageUrl?: string;
  status: string;
  authorName: string;
  authorRole: string;
  authorProfileImage?: string;
  createdAt: string;
  comments: CommentWithAuthor[];
  likesCount: number;
  userLiked: boolean;
}

interface CommentWithAuthor {
  id: string;
  content: string;
  authorName: string;
  authorRole: string;
  authorProfileImage?: string;
  createdAt: string;
}

export default function Posts() {
  const { user } = useAuth();
  const [newPost, setNewPost] = useState({ content: "", imageUrl: "", imageExpiresAt: "" });
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { data: posts, isLoading } = useQuery<PostWithDetails[]>({
    queryKey: ["/api/posts"],
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/posts/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Upload failed');
      }
      return data;
    },
    onSuccess: (data) => {
      setUploadedImage(data.imageUrl);
      setNewPost(prev => ({ ...prev, imageUrl: data.imageUrl, imageExpiresAt: data.expiresAt }));
      toast({ title: "Success", description: "Image uploaded successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (postData: typeof newPost) => {
      const payload = {
        content: postData.content || null,
        imageUrl: postData.imageUrl || null,
        imageExpiresAt: postData.imageExpiresAt || null
      };
      return await apiRequest("POST", "/api/posts", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({ title: "Success", description: "Post submitted for approval" });
      setNewPost({ content: "", imageUrl: "", imageExpiresAt: "" });
      setUploadedImage(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      return await apiRequest("POST", `/api/posts/${postId}/comments`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      setCommentInputs({});
      toast({ title: "Success", description: "Comment added" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleLikeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/like`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be less than 10MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    uploadImageMutation.mutate(file, {
      onSettled: () => setIsUploading(false)
    });
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setNewPost(prev => ({ ...prev, imageUrl: "", imageExpiresAt: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreatePost = () => {
    if (!newPost.content && !newPost.imageUrl) {
      toast({ title: "Error", description: "Please add content or image", variant: "destructive" });
      return;
    }
    createPostMutation.mutate(newPost);
  };

  const handleAddComment = (postId: string) => {
    const content = commentInputs[postId];
    if (!content?.trim()) {
      toast({ title: "Error", description: "Please enter a comment", variant: "destructive" });
      return;
    }
    createCommentMutation.mutate({ postId, content: content.trim() });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'trainer': return 'bg-green-100 text-green-800';
      case 'sales_consultant': return 'bg-purple-100 text-purple-800';
      case 'student': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'sales_consultant': return 'Sales';
      default: return role.charAt(0).toUpperCase() + role.slice(1);
    }
  };

  return (
    <PageLayout title="Community Posts" subtitle="Share and connect with the learning community">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Create Post */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
            <div className="flex items-center gap-3">
              {user && <UserAvatar user={user} className="h-10 w-10" />}
              <div>
                <p className="font-semibold">{user?.firstName} {user?.lastName}</p>
                <Badge className={`text-xs ${getRoleColor(user?.role || '')}`}>
                  {getRoleLabel(user?.role || '')}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            <Textarea
              placeholder="What's on your mind?"
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              className="min-h-[100px] resize-none border-gray-200"
            />
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Image URL (optional)"
                  value={newPost.imageUrl && !uploadedImage ? newPost.imageUrl : ""}
                  onChange={(e) => setNewPost({ ...newPost, imageUrl: e.target.value, imageExpiresAt: "" })}
                  className="flex-1 border-gray-200"
                  disabled={!!uploadedImage}
                />
                <span className="text-gray-400 self-center">OR</span>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !!uploadedImage}
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload"}
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              
              {uploadedImage && (
                <div className="relative">
                  <img
                    src={uploadedImage}
                    alt="Uploaded preview"
                    className="w-full max-h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    Auto-delete in 20 days
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Image className="h-4 w-4" />
                <span>Add image URL or upload file</span>
              </div>
              <Button
                onClick={handleCreatePost}
                disabled={createPostMutation.isPending || isUploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {createPostMutation.isPending ? "Posting..." : "Post"}
              </Button>
            </div>
            <div className="text-xs text-gray-500 bg-yellow-50 p-2 rounded">
              <Clock className="h-3 w-3 inline mr-1" />
              Posts require admin approval before being visible to others
            </div>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-6">
                  <div className="animate-pulse space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No posts yet. Be the first to share something!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {posts?.map((post) => (
              <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Post Header */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {post.authorProfileImage && <AvatarImage src={post.authorProfileImage} alt={post.authorName} />}
                        <AvatarFallback className="bg-blue-100 text-blue-600">
                          {post.authorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{post.authorName}</p>
                          <Badge className={`text-xs ${getRoleColor(post.authorRole)}`}>
                            {getRoleLabel(post.authorRole)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="p-4">
                    {post.content && (
                      <p className="text-gray-800 mb-4 whitespace-pre-wrap">{post.content}</p>
                    )}
                    {post.imageUrl && (
                      <div className="mb-4">
                        <img
                          src={post.imageUrl}
                          alt="Post image"
                          className="w-full rounded-lg max-h-96 object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Post Actions */}
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <button 
                        onClick={() => toggleLikeMutation.mutate(post.id)}
                        disabled={toggleLikeMutation.isPending}
                        className={`flex items-center gap-1 transition-colors ${
                          post.userLiked 
                            ? 'text-red-500 hover:text-red-600' 
                            : 'hover:text-red-500'
                        }`}
                      >
                        <Heart className={`h-4 w-4 ${post.userLiked ? 'fill-current' : ''}`} />
                        <span>{post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}</span>
                      </button>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        <span>{post.comments.length} comments</span>
                      </span>
                    </div>
                  </div>

                  {/* Comments */}
                  {post.comments.length > 0 && (
                    <div className="border-t border-gray-100">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="p-4 border-b border-gray-50 last:border-b-0">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              {comment.authorProfileImage && <AvatarImage src={comment.authorProfileImage} alt={comment.authorName} />}
                              <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                                {comment.authorName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-sm text-gray-900">{comment.authorName}</p>
                                <Badge className={`text-xs ${getRoleColor(comment.authorRole)}`}>
                                  {getRoleLabel(comment.authorRole)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex gap-3">
                      {user && <UserAvatar user={user} className="h-8 w-8" />}
                      <div className="flex-1 flex gap-2">
                        <Input
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          className="flex-1 text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(post.id);
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleAddComment(post.id)}
                          disabled={createCommentMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}