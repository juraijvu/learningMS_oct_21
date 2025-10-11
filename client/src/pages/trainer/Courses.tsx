import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AssignedCourse {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
  studentCount: number;
  moduleCount: number;
}

export default function TrainerCourses() {
  const { data: courses, isLoading } = useQuery<AssignedCourse[]>({
    queryKey: ["/api/trainer/courses"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-my-courses-title">My Courses</h1>

      {courses && courses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No courses assigned yet</p>
            <p className="text-sm text-muted-foreground text-center mt-1">Contact admin for course assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses?.map((course) => (
            <Card key={course.id} className="hover-elevate" data-testid={`card-course-${course.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-role-trainer to-chart-3">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{course.studentCount} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{course.moduleCount} modules</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {course.pdfUrl && (
                    <Button variant="outline" size="sm" asChild>
                      <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button size="sm" asChild className="flex-1">
                    <a href={`/courses/${course.id}/students`} data-testid={`button-view-students-${course.id}`}>
                      View Students
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
