import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, CheckCircle, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  order: number;
}

interface StudentProgress {
  studentId: string;
  completedModules: number;
  totalModules: number;
  completedModuleIds: string[];
}

function ModuleCompletionDialog({ student, modules, courseId }: { student: Student; modules: Module[]; courseId: string }) {
  const [open, setOpen] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { toast } = useToast();

  const requestMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/trainer/request-module-completion", {
        method: "POST",
        body: JSON.stringify({
          moduleId: selectedModuleId,
          studentId: student.id,
          message: message || `Please mark this module as complete when you have finished studying it.`
        })
      });
    },
    onSuccess: () => {
      const selectedModule = modules.find(m => m.id === selectedModuleId);
      toast({
        title: "✅ Request Sent Successfully",
        description: `${student.firstName} ${student.lastName} will be notified to complete "${selectedModule?.title}"`
      });
      setOpen(false);
      setConfirmOpen(false);
      setSelectedModuleId("");
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Request Failed",
        description: error.message || "Failed to send completion request"
      });
      setConfirmOpen(false);
    }
  });

  const handleSubmit = () => {
    if (!selectedModuleId) {
      toast({
        variant: "destructive",
        title: "Module Required",
        description: "Please select a module"
      });
      return;
    }
    setConfirmOpen(true);
  };

  const selectedModule = modules.find(m => m.id === selectedModuleId);

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-1">
            <MessageSquare className="h-3 w-3" />
            Request Completion
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Module Completion</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Student</label>
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <UserAvatar user={student as any} className="h-6 w-6" />
                <span className="text-sm">{student.firstName} {student.lastName}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Module</label>
              <Select value={selectedModuleId} onValueChange={setSelectedModuleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module.id} value={module.id}>
                      Module {module.order}: {module.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Message (Optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add a custom message for the student..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={requestMutation.isPending}>
                {requestMutation.isPending ? "Sending..." : "Send Request"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="📋 Send Module Completion Request"
        description={`Send a request to ${student.firstName} ${student.lastName} to mark "${selectedModule?.title}" as complete? They will receive a notification and can respond to your request.`}
        onConfirm={() => requestMutation.mutate()}
        confirmText="✅ Send Request"
        cancelText="Cancel"
      />
    </>
  );
}

export default function TrainerCourseStudents() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: [`/api/trainer/courses/${courseId}/students`],
  });

  const { data: modules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  const { data: allProgress } = useQuery<StudentProgress[]>({
    queryKey: [`/api/trainer/courses/${courseId}/progress`],
  });

  const getStudentProgress = (studentId: string) => {
    return allProgress?.find(p => p.studentId === studentId);
  };

  if (isLoading) {
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
        <h1 className="text-3xl font-semibold">Course Students</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Enrolled Students
          </CardTitle>
          <CardDescription>Track student progress and module completion</CardDescription>
        </CardHeader>
        <CardContent>
          {students && students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {students?.map((student) => {
                const progress = getStudentProgress(student.id);
                const completionPercentage = progress && progress.totalModules > 0 
                  ? Math.round((progress.completedModules / progress.totalModules) * 100) 
                  : 0;
                
                return (
                  <div
                    key={student.id}
                    className="flex items-center gap-4 p-4 rounded-lg border"
                    data-testid={`student-${student.id}`}
                  >
                    <UserAvatar user={student as any} className="h-12 w-12" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {modules && modules.length > 0 && (
                            <ModuleCompletionDialog 
                              student={student} 
                              modules={modules} 
                              courseId={courseId!} 
                            />
                          )}
                          {progress && (
                            <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                              {completionPercentage}% Complete
                            </Badge>
                          )}
                        </div>
                      </div>
                      {progress && progress.totalModules > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{progress.completedModules} of {progress.totalModules} modules completed</span>
                            {completionPercentage === 100 && (
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <Progress value={completionPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
