import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, X, MessageSquare, User, BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

interface CompletionRequest {
  id: string;
  moduleId: string;
  moduleTitle: string;
  courseTitle: string;
  trainerName: string;
  message: string;
  status: 'pending' | 'completed' | 'dismissed';
  requestedAt: string;
}

export default function CompletionRequests() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<CompletionRequest[]>({
    queryKey: ["/api/student/completion-requests"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: 'complete' | 'dismiss' }) => {
      const response = await fetch(`/api/student/completion-requests/${requestId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) throw new Error('Failed to respond');
      return response.json();
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/completion-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/courses"] });
      
      if (action === 'complete') {
        toast({
          title: "✅ Module Marked as Complete",
          description: "You have successfully completed the module as requested by your trainer."
        });
      } else {
        toast({
          title: "🗙️ Request Dismissed",
          description: "The completion request has been dismissed."
        });
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "❌ Action Failed",
        description: "Failed to respond to the request. Please try again."
      });
    }
  });

  const handleComplete = (requestId: string) => {
    respondMutation.mutate({ requestId, action: 'complete' });
  };

  const handleDismiss = (requestId: string) => {
    respondMutation.mutate({ requestId, action: 'dismiss' });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Pending</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-700">Completed</Badge>;
      case 'dismissed':
        return <Badge variant="outline" className="text-gray-600">Dismissed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Completion Requests" subtitle="Module completion requests from your trainers">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const completedRequests = requests?.filter(r => r.status !== 'pending') || [];

  return (
    <PageLayout title="Completion Requests" subtitle="Module completion requests from your trainers">
      <div className="space-y-6">
        {/* Pending Requests */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5" />
              </div>
              Pending Requests ({pendingRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-orange-600" />
                </div>
                <p className="text-orange-700 font-medium text-lg">No pending requests</p>
                <p className="text-sm text-orange-500 mt-1">Your trainers will send completion requests here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-orange-600" />
                          <span className="font-semibold text-orange-900">{request.moduleTitle}</span>
                        </div>
                        <p className="text-sm text-orange-700">{request.courseTitle}</p>
                        <div className="flex items-center gap-2 text-xs text-orange-600">
                          <User className="h-3 w-3" />
                          <span>From: {request.trainerName}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{formatTime(request.requestedAt)}</span>
                        </div>
                        <p className="text-sm text-gray-700 bg-white/60 p-3 rounded-lg mt-2">
                          {request.message}
                        </p>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleComplete(request.id)}
                          disabled={respondMutation.isPending}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {respondMutation.isPending ? "Processing..." : "✅ Mark Complete"}
                        </Button>
                        <Button
                          onClick={() => handleDismiss(request.id)}
                          disabled={respondMutation.isPending}
                          variant="outline"
                          size="sm"
                          className="text-gray-600 border-gray-300"
                        >
                          <X className="h-4 w-4 mr-1" />
                          {respondMutation.isPending ? "Processing..." : "Dismiss"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Request History */}
        {completedRequests.length > 0 && (
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-600 to-gray-700 text-white">
              <CardTitle className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-5 w-5" />
                </div>
                Request History ({completedRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {completedRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900">{request.moduleTitle}</span>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="text-sm text-gray-600">{request.courseTitle}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <User className="h-3 w-3" />
                          <span>{request.trainerName}</span>
                          <Clock className="h-3 w-3 ml-2" />
                          <span>{formatTime(request.requestedAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}