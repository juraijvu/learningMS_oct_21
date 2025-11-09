import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, User, BookOpen, Award } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentProgress {
  studentId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  courseTitle: string;
  totalModules: number;
  completedModules: number;
  progressPercentage: number;
  modules: {
    id: string;
    title: string;
    order: number;
    isCompleted: boolean;
    completedAt?: string;
  }[];
}

export default function StudentProgress() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: progressData, isLoading } = useQuery<StudentProgress[]>({
    queryKey: [`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/student-progress`],
  });

  const toggleModuleMutation = useMutation({
    mutationFn: async ({ studentId, moduleId, isCompleted }: { studentId: string; moduleId: string; isCompleted: boolean }) => {
      return await apiRequest(`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/student-progress/${studentId}/module/${moduleId}`, {
        method: "PATCH",
        body: { isCompleted }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/student-progress`] });
      toast({ title: "Success", description: "Module progress updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update module progress", variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Award className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-semibold">Student Progress</h1>
        </div>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
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

  const groupedProgress = progressData?.reduce((acc, progress) => {
    if (!acc[progress.courseId]) {
      acc[progress.courseId] = {
        courseTitle: progress.courseTitle,
        students: []
      };
    }
    acc[progress.courseId].students.push(progress);
    return acc;
  }, {} as Record<string, { courseTitle: string; students: StudentProgress[] }>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Award className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-semibold">Student Progress</h1>
          <p className="text-muted-foreground">Track and manage student module completion</p>
        </div>
      </div>

      {!groupedProgress || Object.keys(groupedProgress).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No student progress data available</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProgress).map(([courseId, { courseTitle, students }]) => (
            <Card key={courseId}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {courseTitle}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {students.map((student) => (
                  <div key={student.studentId} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">{student.studentName}</h3>
                          <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={student.progressPercentage === 100 ? "default" : "secondary"}>
                          {student.completedModules}/{student.totalModules} Modules
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {student.progressPercentage}% Complete
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{student.progressPercentage}%</span>
                      </div>
                      <Progress value={student.progressPercentage} className="h-2" />
                    </div>

                    <div className="grid gap-2">
                      <h4 className="font-medium text-sm">Module Progress:</h4>
                      <div className="grid gap-2">
                        {student.modules.map((module) => (
                          <div key={module.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="p-1 h-6 w-6"
                                onClick={() => toggleModuleMutation.mutate({
                                  studentId: student.studentId,
                                  moduleId: module.id,
                                  isCompleted: !module.isCompleted
                                })}
                                disabled={toggleModuleMutation.isPending}
                              >
                                {module.isCompleted ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Circle className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <span className={`text-sm ${module.isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                                Module {module.order}: {module.title}
                              </span>
                            </div>
                            {module.isCompleted && module.completedAt && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(module.completedAt).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}