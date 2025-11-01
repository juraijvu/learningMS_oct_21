import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";
import type { Query } from "@shared/schema";

interface QueryWithModule extends Query {
  moduleTitle: string;
  courseTitle: string;
}

export default function StudentQueries() {
  const [newQuery, setNewQuery] = useState({ moduleId: "", query: "" });
  const [modules, setModules] = useState<{ id: string; title: string }[]>([]);
  const { toast } = useToast();

  const { data: queries, isLoading } = useQuery<QueryWithModule[]>({
    queryKey: ["/api/student/queries"],
  });

  const { data: availableModules } = useQuery<{ id: string; title: string; courseTitle: string }[]>({
    queryKey: ["/api/student/modules"],
  });

  // Update modules when data changes
  React.useEffect(() => {
    if (availableModules) {
      setModules(availableModules);
    }
  }, [availableModules]);

  const createQueryMutation = useMutation({
    mutationFn: async (queryData: typeof newQuery) => {
      return await apiRequest("/api/student/queries", {
        method: "POST",
        body: queryData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/queries"] });
      toast({ title: "Success", description: "Query submitted successfully" });
      setNewQuery({ moduleId: "", query: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <PageLayout title="My Queries" subtitle="Ask questions and get help from your trainers">
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
      title="My Queries" 
      subtitle="Ask questions and get help from your trainers"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <MessageSquare className="h-5 w-5" />
            </div>
            Submit a Query
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="module">Select Module</Label>
            <Select value={newQuery.moduleId} onValueChange={(value) => setNewQuery({ ...newQuery, moduleId: value })}>
              <SelectTrigger data-testid="select-module">
                <SelectValue placeholder="Choose a module..." />
              </SelectTrigger>
              <SelectContent>
                {modules?.map((module) => (
                  <SelectItem key={module.id} value={module.id}>
                    {module.courseTitle} - {module.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="query">Your Question</Label>
            <Textarea
              id="query"
              value={newQuery.query}
              onChange={(e) => setNewQuery({ ...newQuery, query: e.target.value })}
              placeholder="Describe your doubt or question..."
              rows={4}
              data-testid="input-query"
            />
          </div>
          <Button
            onClick={() => createQueryMutation.mutate(newQuery)}
            disabled={!newQuery.moduleId || !newQuery.query || createQueryMutation.isPending}
            data-testid="button-submit-query"
          >
            {createQueryMutation.isPending ? "Submitting..." : "Submit Query"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Queries ({pendingQueries.length})</h2>
          {pendingQueries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending queries</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingQueries.map((query) => (
                <Card key={query.id} data-testid={`card-query-${query.id}`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{query.courseTitle}</Badge>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{query.moduleTitle}</span>
                        </div>
                        <CardTitle className="text-base">{query.query}</CardTitle>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                        <Clock className="h-3 w-3 mr-1" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Submitted: {new Date(query.createdAt!).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Resolved Queries ({resolvedQueries.length})</h2>
          {resolvedQueries.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No resolved queries yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {resolvedQueries.map((query) => (
                <Card key={query.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{query.courseTitle}</Badge>
                          <span className="text-sm text-muted-foreground">•</span>
                          <span className="text-sm text-muted-foreground">{query.moduleTitle}</span>
                        </div>
                        <CardTitle className="text-base">{query.query}</CardTitle>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    </div>
                  </CardHeader>
                  {query.response && (
                    <CardContent>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium mb-1">Trainer's Response:</p>
                        <p className="text-sm text-muted-foreground">{query.response}</p>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
