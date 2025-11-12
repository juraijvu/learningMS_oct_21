import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, User, BookOpen, Award, ArrowLeft, Mail, Phone, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link, useParams } from "wouter";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface StudentProgressDetail {
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentProfileImage?: string;
  courses: {
    courseId: string;
    courseTitle: string;
    totalModules: number;
    completedModules: number;
    progressPercentage: number;
    modules: {
      id: string;
      title: string;
      order: number;
      subPoints?: string[];
      isCompleted: boolean;
      completedAt?: string;
    }[];
  }[];
}

export default function StudentProgressDetail() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; moduleId: string; moduleTitle: string }>({ open: false, moduleId: '', moduleTitle: '' });

  const { data: studentData, isLoading } = useQuery<StudentProgressDetail>({
    queryKey: [`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/student-progress/${studentId}`],
    enabled: !!studentId,
  });

  const { data: completionRequests } = useQuery({
    queryKey: [`/api/trainer/completion-requests/${studentId}`],
    enabled: !!studentId && user?.role === 'trainer',
  });

  const requestCompletionMutation = useMutation({
    mutationFn: async ({ moduleId, message }: { moduleId: string; message: string }) => {
      const response = await fetch('/api/trainer/request-module-completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId, studentId, message }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to send request' }));
        throw new Error(errorData.message || 'Failed to send request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/student-progress/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/trainer/completion-requests/${studentId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      
      const moduleTitle = confirmDialog.moduleTitle;
      toast({
        title: "✅ Request Sent Successfully",
        description: `${studentData?.studentName} will be notified to complete "${moduleTitle}"`
      });
      setConfirmDialog({ open: false, moduleId: '', moduleTitle: '' });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "❌ Request Failed",
        description: error.message || "Failed to send completion request"
      });
      setConfirmDialog({ open: false, moduleId: '', moduleTitle: '' });
    },
  });

  const handleRequestCompletion = (moduleId: string, moduleTitle: string) => {
    setConfirmDialog({ open: true, moduleId, moduleTitle });
  };

  const confirmRequest = () => {
    const message = `Please mark "${confirmDialog.moduleTitle}" as complete when you have finished studying all the materials.`;
    requestCompletionMutation.mutate({ moduleId: confirmDialog.moduleId, message });
  };

  const isModuleRequested = (moduleId: string) => {
    return completionRequests?.some((req: any) => req.moduleId === moduleId && req.status === 'pending') || false;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-6 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </CardHeader>
        </Card>
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!studentData) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Student not found</p>
            <Link href="/student-progress">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Overview
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const overallProgress = studentData.courses.length > 0 
    ? Math.round(studentData.courses.reduce((sum, course) => sum + course.progressPercentage, 0) / studentData.courses.length)
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/student-progress">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold">Student Progress Details</h1>
          <p className="text-muted-foreground">Detailed progress view for individual student</p>
        </div>
      </div>

      {/* Student Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-6">
            <div className="relative">
              {studentData.studentProfileImage ? (
                <img
                  src={studentData.studentProfileImage}
                  alt={studentData.studentName}
                  className="h-20 w-20 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center border-4 border-blue-200">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{studentData.studentName}</h2>
              <div className="flex items-center gap-4 mt-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{studentData.studentEmail}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{studentData.studentPhone || "Phone number not added"}</span>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">
                    {studentData.courses.length} Course{studentData.courses.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-green-600" />
                  <span className="font-medium">{overallProgress}% Overall Progress</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="w-32">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span className="font-medium">{overallProgress}%</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Course Progress */}
      <div className="space-y-6">
        {studentData.courses.map((course) => (
          <Card key={course.courseId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {course.courseTitle}
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge variant={course.progressPercentage === 100 ? "default" : "secondary"}>
                    {course.completedModules}/{course.totalModules} Modules
                  </Badge>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm mb-1">
                      <span>Progress:</span>
                      <span className="font-medium">{course.progressPercentage}%</span>
                    </div>
                    <Progress value={course.progressPercentage} className="w-24 h-2" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {course.modules.map((module, index) => (
                <div key={module.id} className="p-4 rounded-lg border bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-1 h-7 w-7 flex items-center justify-center">
                        {module.isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <span className={`font-medium ${module.isCompleted ? 'text-green-700' : ''}`}>
                        Module {index + 1}: {module.title}
                      </span>
                      {module.isCompleted && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                          Completed
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {module.isCompleted && module.completedAt && (
                        <span className="text-sm text-muted-foreground">
                          Completed: {new Date(module.completedAt).toLocaleDateString()}
                        </span>
                      )}
                      {!module.isCompleted && user?.role === 'trainer' && (
                        <div className="flex items-center gap-2">
                          {isModuleRequested(module.id) && (
                            <Badge variant="outline" className="border-orange-300 text-orange-700 bg-orange-50 text-xs">
                              📋 Requested
                            </Badge>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestCompletion(module.id, module.title)}
                            disabled={requestCompletionMutation.isPending || isModuleRequested(module.id)}
                            className={isModuleRequested(module.id) ? "opacity-50 cursor-not-allowed" : "text-blue-600 border-blue-200 hover:bg-blue-50"}
                          >
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {isModuleRequested(module.id) ? "Already Requested" : "Request Completion"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {module.subPoints && module.subPoints.length > 0 && (
                    <div className="mt-3 ml-10">
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {module.subPoints.map((point, pointIndex) => (
                          <li key={pointIndex} className="flex items-start gap-2">
                            <span className="text-muted-foreground mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {studentData.courses.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No courses enrolled</p>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}
        title="📋 Send Module Completion Request"
        description={`Send a request to ${studentData?.studentName} to mark "${confirmDialog.moduleTitle}" as complete? They will receive a notification and can respond to your request.`}
        onConfirm={confirmRequest}
        confirmText="✅ Send Request"
        cancelText="Cancel"
      />
    </div>
  );
}