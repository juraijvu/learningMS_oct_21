import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, Clock, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

interface QueryWithDetails {
  id: string;
  query: string;
  response?: string;
  isResolved: boolean;
  createdAt: string;
  resolvedAt?: string;
  moduleTitle: string;
  courseTitle: string;
  studentName: string;
}

export default function TrainerQueries() {
  const [responses, setResponses] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  const { data: queries, isLoading } = useQuery<QueryWithDetails[]>({
    queryKey: ["/api/trainer/queries"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ queryId, response }: { queryId: string; response: string }) => {
      return await apiRequest("PATCH", `/api/trainer/queries/${queryId}/respond`, { response });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/queries"] });
      toast({ title: "Success", description: "Response sent successfully" });
      setResponses({});
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleResponseChange = (queryId: string, value: string) => {
    setResponses(prev => ({ ...prev, [queryId]: value }));
  };

  const handleSubmitResponse = (queryId: string) => {
    const response = responses[queryId];
    if (!response || response.trim() === '') {
      toast({ title: "Error", description: "Please enter a response", variant: "destructive" });
      return;
    }
    respondMutation.mutate({ queryId, response: response.trim() });
  };

  if (isLoading) {
    return (
      <PageLayout title="Student Queries" subtitle="Respond to student questions and doubts">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  const pendingQueries = queries?.filter(q => !q.isResolved) || [];
  const resolvedQueries = queries?.filter(q => q.isResolved) || [];

  return (
    <PageLayout 
      title="Student Queries" 
      subtitle="Respond to student questions and doubts"
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Pending Queries ({pendingQueries.length})</h2>
          {pendingQueries.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-blue-400 mb-4" />
                <p className="text-gray-600">No pending queries</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingQueries.map((query) => (
                <Card key={query.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {query.courseTitle}
                          </Badge>
                          <span className="text-blue-100">•</span>
                          <span className="text-blue-100 text-sm">{query.moduleTitle}</span>
                        </div>
                        <CardTitle className="text-lg text-white">From: {query.studentName}</CardTitle>
                      </div>
                      <Badge className="bg-amber-500/20 text-amber-100 border-amber-400/30">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Student's Question:</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-800">{query.query}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Asked: {new Date(query.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`response-${query.id}`} className="text-sm font-medium text-gray-700">
                        Your Response:
                      </Label>
                      <Textarea
                        id={`response-${query.id}`}
                        value={responses[query.id] || ''}
                        onChange={(e) => handleResponseChange(query.id, e.target.value)}
                        placeholder="Type your response to help the student..."
                        rows={4}
                        className="resize-none"
                      />
                      <Button
                        onClick={() => handleSubmitResponse(query.id)}
                        disabled={!responses[query.id]?.trim() || respondMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {respondMutation.isPending ? "Sending..." : "Send Response"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Resolved Queries ({resolvedQueries.length})</h2>
          {resolvedQueries.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-blue-400 mb-4" />
                <p className="text-gray-600">No resolved queries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resolvedQueries.map((query) => (
                <Card key={query.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                            {query.courseTitle}
                          </Badge>
                          <span className="text-green-100">•</span>
                          <span className="text-green-100 text-sm">{query.moduleTitle}</span>
                        </div>
                        <CardTitle className="text-lg text-white">From: {query.studentName}</CardTitle>
                      </div>
                      <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Student's Question:</Label>
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                        <p className="text-gray-800">{query.query}</p>
                      </div>
                    </div>
                    
                    {query.response && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Your Response:</Label>
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-gray-800">{query.response}</p>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Resolved: {query.resolvedAt ? new Date(query.resolvedAt).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}