import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { User, BookOpen, Award, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

interface StudentProgressOverview {
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
  }[];
  overallProgress: number;
}

export default function StudentProgressOverview() {
  const { user } = useAuth();

  const { data: studentsData, isLoading } = useQuery<StudentProgressOverview[]>({
    queryKey: [`/api/${user?.role === 'admin' ? 'admin' : user?.role === 'sales_consultant' ? 'sales' : 'trainer'}/students-overview`],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Award className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-semibold">Student Progress Overview</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div>
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-48" />
                    </div>
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Award className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-semibold">Student Progress Overview</h1>
          <p className="text-muted-foreground">Click on any student to view detailed progress</p>
        </div>
      </div>

      {!studentsData || studentsData.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <User className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No students found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {studentsData.map((student) => (
            <Card key={student.studentId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {student.studentProfileImage ? (
                        <img
                          src={student.studentProfileImage}
                          alt={student.studentName}
                          className="h-12 w-12 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center border-2 border-blue-200">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{student.studentName}</h3>
                      <p className="text-sm text-muted-foreground">{student.studentEmail}</p>
                      {student.studentPhone && (
                        <p className="text-sm text-muted-foreground">{student.studentPhone}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">
                            {student.courses.length} Course{student.courses.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {student.overallProgress}% Overall Progress
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex flex-wrap gap-1 mb-2">
                        {student.courses.map((course) => (
                          <Badge key={course.courseId} variant="outline" className="text-xs">
                            {course.courseTitle}: {course.progressPercentage}%
                          </Badge>
                        ))}
                      </div>
                      <div className="w-32">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Overall</span>
                          <span>{student.overallProgress}%</span>
                        </div>
                        <Progress value={student.overallProgress} className="h-2" />
                      </div>
                    </div>
                    <Link href={`/student-progress/${student.studentId}`}>
                      <Button size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}