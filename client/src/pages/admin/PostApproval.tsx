import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Clock, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";

interface PendingPost {
  id: string;
  content?: string;
  imageUrl?: string;
  authorName: string;
  authorRole: string;
  createdAt: string;
}

export default function PostApproval() {
  const { toast } = useToast();

  const { data: pendingPosts, isLoading } = useQuery<PendingPost[]>({
    queryKey: ["/api/admin/posts/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("PATCH", `/api/admin/posts/${postId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts/pending"] });
      toast({ title: "Success", description: "Post approved successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("PATCH", `/api/admin/posts/${postId}/reject`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/posts/pending"] });
      toast({ title: "Success", description: "Post rejected" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

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
    <PageLayout 
      title="Post Approval" 
      subtitle="Review and approve community posts"
    >
      <div className="max-w-4xl mx-auto">
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
        ) : pendingPosts?.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No pending posts to review</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm">
                <Clock className="h-4 w-4 inline mr-2" />
                {pendingPosts?.length} post{pendingPosts?.length !== 1 ? 's' : ''} awaiting approval
              </p>
            </div>

            {pendingPosts?.map((post) => (
              <Card key={post.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-white/20 text-white">
                          {post.authorName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{post.authorName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${getRoleColor(post.authorRole)}`}>
                            {getRoleLabel(post.authorRole)}
                          </Badge>
                          <span className="text-orange-100 text-sm">
                            {new Date(post.createdAt).toLocaleDateString()} at {new Date(post.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge className="bg-amber-200 text-amber-800">
                      <Clock className="h-3 w-3 mr-1" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Post Content */}
                  <div className="mb-6">
                    {post.content && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Content:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
                        </div>
                      </div>
                    )}
                    {post.imageUrl && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Image:</h4>
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <img
                            src={post.imageUrl}
                            alt="Post image"
                            className="max-w-full h-auto rounded-lg max-h-64 object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = '<div class="flex items-center gap-2 text-red-500"><Image class="h-4 w-4" /><span class="text-sm">Failed to load image</span></div>';
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <Button
                      onClick={() => approveMutation.mutate(post.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {approveMutation.isPending ? "Approving..." : "Approve Post"}
                    </Button>
                    <Button
                      onClick={() => rejectMutation.mutate(post.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                      variant="destructive"
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      {rejectMutation.isPending ? "Rejecting..." : "Reject Post"}
                    </Button>
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