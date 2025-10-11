import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
  moduleCount: number;
  completedModules: number;
}

export default function StudentCourses() {
  const { data: courses, isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ["/api/student/courses"],
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
            <p className="text-muted-foreground text-center">No courses enrolled yet</p>
            <p className="text-sm text-muted-foreground text-center mt-1">Contact your sales consultant to enroll in courses</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses?.map((course) => {
            const progressPercentage = course.moduleCount > 0 
              ? (course.completedModules / course.moduleCount) * 100 
              : 0;

            return (
              <Card key={course.id} className="hover-elevate" data-testid={`card-course-${course.id}`}>
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-2">
                      <BookOpen className="h-6 w-6 text-primary-foreground" />
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
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        {course.completedModules} / {course.moduleCount} modules
                      </span>
                    </div>
                    <Progress value={progressPercentage} className="h-2" />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {course.pdfUrl && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer" data-testid={`button-course-pdf-${course.id}`}>
                          <FileText className="h-4 w-4 mr-1" />
                          Course PDF
                        </a>
                      </Button>
                    )}
                    <Button size="sm" asChild className="ml-auto">
                      <a href={`/courses/${course.id}`} data-testid={`button-view-course-${course.id}`}>
                        View Course
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
