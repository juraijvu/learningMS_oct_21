import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
}

interface StudentProgress {
  studentId: string;
  completedModules: number;
  totalModules: number;
  completedModuleIds: string[];
}

export default function TrainerCourseStudents() {
  const { courseId } = useParams<{ courseId: string }>();

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
                        {progress && (
                          <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                            {completionPercentage}% Complete
                          </Badge>
                        )}
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
