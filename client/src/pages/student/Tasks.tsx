import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Upload, CheckCircle, Clock, AlertCircle, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";
import type { Task } from "@shared/schema";

const statusConfig = {
  pending: { label: "Not Started", icon: Clock, color: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", icon: Upload, color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" },
  approved: { label: "Approved", icon: CheckCircle, color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" },
  needs_revision: { label: "Needs Revision", icon: AlertCircle, color: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
};

export default function StudentTasks() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/student/tasks"],
  });

  const submitTaskMutation = useMutation({
    mutationFn: async ({ taskId, fileUrl }: { taskId: string; fileUrl: string }) => {
      return await apiRequest("POST", `/api/student/tasks/${taskId}/submit`, { fileUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/tasks"] });
      toast({ title: "Success", description: "Task submitted successfully" });
      setSelectedFile(null);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFileUpload = async (taskId: string) => {
    if (!selectedFile) return;
    
    // In a real app, you would upload the file to a storage service
    // For now, we'll use a placeholder URL
    const fileUrl = `https://storage.example.com/${selectedFile.name}`;
    submitTaskMutation.mutate({ taskId, fileUrl });
  };

  const pendingTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'needs_revision') || [];
  const submittedTasks = tasks?.filter(t => t.status === 'submitted') || [];
  const completedTasks = tasks?.filter(t => t.status === 'approved') || [];

  if (isLoading) {
    return (
      <PageLayout title="My Tasks" subtitle="Submit assignments and track your progress">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="My Tasks" 
      subtitle="Submit assignments and track your progress"
    >
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending-tasks">
            Pending ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="submitted" data-testid="tab-submitted-tasks">
            Submitted ({submittedTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-tasks">
            Completed ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No pending tasks</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingTasks.map((task) => {
                const statusInfo = statusConfig[task.status as keyof typeof statusConfig];
                const StatusIcon = statusInfo.icon;

                return (
                  <Card key={task.id} data-testid={`card-task-${task.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                          {task.description && (
                            <CardDescription className="mt-2">{task.description}</CardDescription>
                          )}
                        </div>
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {task.status === 'needs_revision' && task.trainerComment && (
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Trainer's Comment:</p>
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{task.trainerComment}</p>
                        </div>
                      )}
                      
                      {(task as any).trainerFileUrl && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Task Materials:</p>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                              {(task as any).trainerFileName || 'Task File'}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/tasks/download/${task.id}`, '_blank')}
                              className="border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Download
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor={`file-${task.id}`}>Upload Your Solution</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`file-${task.id}`}
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            data-testid={`input-file-${task.id}`}
                          />
                          <Button
                            onClick={() => handleFileUpload(task.id)}
                            disabled={!selectedFile || submitTaskMutation.isPending}
                            data-testid={`button-submit-${task.id}`}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Submit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          {submittedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No submitted tasks</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {submittedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription className="mt-2">{task.description}</CardDescription>
                        )}
                      </div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                        <Upload className="h-3 w-3 mr-1" />
                        Under Review
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(task as any).trainerFileUrl && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Task Materials:</p>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                            {(task as any).trainerFileName || 'Task File'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/tasks/download/${task.id}`, '_blank')}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      Submitted: {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : 'N/A'}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No completed tasks</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <Card key={task.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        {task.description && (
                          <CardDescription className="mt-2">{task.description}</CardDescription>
                        )}
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {(task as any).trainerFileUrl && (
                      <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">Task Materials:</p>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-300 flex-1">
                            {(task as any).trainerFileName || 'Task File'}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`/api/tasks/download/${task.id}`, '_blank')}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    )}
                    {task.trainerComment && (
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="text-sm font-medium">Trainer's Feedback:</p>
                        <p className="text-sm text-muted-foreground mt-1">{task.trainerComment}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageLayout>
  );
}
