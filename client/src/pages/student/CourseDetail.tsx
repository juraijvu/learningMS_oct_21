import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, CheckCircle, Download, Video, FileIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Module {
  id: string;
  title: string;
  subPoints: string[];
  order: number;
}

interface ModuleProgress {
  id: string;
  moduleId: string;
  title: string;
  courseTitle: string;
  subPoints: string[];
  isCompleted: boolean;
  completedAt?: string;
}

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

interface Course {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
}

interface ClassMaterial {
  id: string;
  type: 'video' | 'note';
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string;
  allowDownload: boolean;
}

export default function StudentCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; moduleId: string; moduleTitle: string }>({ open: false, moduleId: '', moduleTitle: '' });
  const [confirmed, setConfirmed] = useState(false);

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: modules, isLoading: loadingModules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  const { data: materials, isLoading: loadingMaterials } = useQuery<ClassMaterial[]>({
    queryKey: [`/api/class-materials/${courseId}`],
  });

  const { data: progress } = useQuery<ModuleProgress[]>({
    queryKey: ['/api/student/progress'],
  });

  const { data: completionRequests } = useQuery<CompletionRequest[]>({
    queryKey: ['/api/student/completion-requests'],
  });

  const completeModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      try {
        return await apiRequest(`/api/student/progress/${moduleId}/complete`, {
          method: "POST",
        });
      } catch (error: any) {
        console.error('[Client] API request failed:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/progress'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/courses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/completion-requests'] });
      toast({
        title: "✅ Module Completed!",
        description: data?.message || "You've successfully marked this module as complete.",
      });
    },
    onError: (error: any) => {
      console.error('[Client] Module completion error:', error);
      
      let errorMessage = "Failed to mark module as complete. Please try again.";
      
      // Handle network errors
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        errorMessage = "Network error: Please check if the server is running and try again.";
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.status === 401) {
        errorMessage = "You are not authorized to complete this module.";
      } else if (error?.status === 403) {
        errorMessage = "You are not enrolled in this course.";
      } else if (error?.status === 404) {
        errorMessage = "Module not found.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const isModuleCompleted = (moduleId: string) => {
    return progress?.some(p => p.moduleId === moduleId && p.isCompleted) || false;
  };

  const getModuleRequestStatus = (moduleId: string) => {
    return completionRequests?.find(r => r.moduleId === moduleId && r.status === 'pending');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const daysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  if (loadingCourse || loadingModules) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <a href="/courses" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </a>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">{course?.title}</h1>
          <p className="text-muted-foreground mt-1">{course?.description}</p>
        </div>
      </div>

      {course?.pdfUrl && (
        <Card>
          <CardContent className="pt-6">
            <a 
              href={course.pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-primary hover:underline"
            >
              <FileText className="h-5 w-5 mr-2" />
              Download Course Materials (PDF)
            </a>
          </CardContent>
        </Card>
      )}

      {materials && materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Shared Class Materials
            </CardTitle>
            <CardDescription>
              Videos and notes shared by your trainer. Materials automatically expire after 10 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMaterials ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                {materials?.map((material) => {
                  const daysLeft = daysUntilExpiry(material.expiresAt);
                  return (
                    <div
                      key={material.id}
                      className="flex items-center gap-3 p-3 rounded border hover:bg-muted/50 transition-colors"
                      data-testid={`material-${material.id}`}
                    >
                      <div className="flex-shrink-0">
                        {material.type === 'video' ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{material.title}</p>
                        {material.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{material.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(material.fileSize)} • 
                          <span className={daysLeft <= 2 ? "text-destructive font-medium" : ""}>
                            {' '}Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                          </span>
                        </p>
                      </div>
                      {material.allowDownload ? (
                        <Button size="sm" variant="outline" asChild data-testid={`button-download-${material.id}`}>
                          <a href={`/api/class-materials/download/${material.id}`} download>
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          disabled 
                          className="opacity-50"
                          title="Download disabled by trainer"
                          data-testid={`button-download-disabled-${material.id}`}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View Only
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Course Modules
          </CardTitle>
          <CardDescription>Complete each module to track your progress</CardDescription>
        </CardHeader>
        <CardContent>
          {modules && modules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No modules available yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {modules?.map((module, index) => {
                const completed = isModuleCompleted(module.id);
                return (
                  <div
                    key={module.id}
                    className="p-4 rounded-lg border"
                    data-testid={`module-${module.id}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full ${completed ? 'bg-green-100 dark:bg-green-900' : 'bg-primary/10'}`}>
                        {completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{module.title}</h3>
                          {completed && (
                            <Badge variant="default" className="bg-green-600 dark:bg-green-700">Completed</Badge>
                          )}
                          {!completed && getModuleRequestStatus(module.id) && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50">
                              📋 Requested by Trainer
                            </Badge>
                          )}
                        </div>
                        {module.subPoints && module.subPoints.length > 0 && (
                          <ul className="space-y-1">
                            {module.subPoints.map((point, i) => (
                              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="text-primary mt-1">•</span>
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {!completed && (
                          <div className="mt-3 space-y-2">
                            {getModuleRequestStatus(module.id) && (
                              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                <p className="text-sm text-orange-800 font-medium">
                                  📋 Your trainer has requested you to complete this module
                                </p>
                                <p className="text-xs text-orange-600 mt-1">
                                  {getModuleRequestStatus(module.id)?.message}
                                </p>
                              </div>
                            )}
                            <Button
                              size="sm"
                              className={getModuleRequestStatus(module.id) ? "bg-orange-600 hover:bg-orange-700" : ""}
                              onClick={() => {
                                setConfirmDialog({ open: true, moduleId: module.id, moduleTitle: module.title });
                                setConfirmed(false);
                              }}
                              disabled={completeModuleMutation.isPending}
                              data-testid={`button-complete-${module.id}`}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              {completeModuleMutation.isPending ? "Marking..." : "Mark as Complete"}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Module Completion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Are you sure you want to mark "{confirmDialog.moduleTitle}" as complete?
            </p>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirm-completion"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(checked === true)}
              />
              <label
                htmlFor="confirm-completion"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                I confirm that I have fully reviewed and understood this module
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog({ open: false, moduleId: '', moduleTitle: '' })}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirmed) {
                  completeModuleMutation.mutate(confirmDialog.moduleId);
                  setConfirmDialog({ open: false, moduleId: '', moduleTitle: '' });
                }
              }}
              disabled={!confirmed || completeModuleMutation.isPending}
            >
              {completeModuleMutation.isPending ? "Marking..." : "Mark as Complete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
