import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, FileText, ChevronRight, Send } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  pdfUrl?: string;
  moduleCount: number;
  completedModules: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  pdfUrl?: string;
}

export default function StudentCourses() {
  const { toast } = useToast();
  
  const { data: courses, isLoading } = useQuery<EnrolledCourse[]>({
    queryKey: ["/api/student/courses"],
  });

  const enrolledCourseIds = courses?.map(c => c.id) || [];
  const categories = Array.from(new Set(courses?.map(c => c.category).filter(Boolean)));

  const { data: relatedCourses, isLoading: isLoadingRelated } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
    enabled: categories.length > 0,
  });

  const filteredRelatedCourses = relatedCourses?.filter(
    course => course.category && 
              categories.includes(course.category) && 
              !enrolledCourseIds.includes(course.id)
  ) || [];

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      return await apiRequest("/api/enrollment-requests", { method: "POST", body: { courseId } });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Request Sent",
        description: data.message || "Your enrollment request has been sent to the admin",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/my-enrollment-requests"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send enrollment request",
      });
    },
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
    <PageLayout 
      title="My Courses" 
      subtitle="Access your enrolled courses and track progress"
    >

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
              <Card key={course.id} className="hover-elevate overflow-hidden" data-testid={`card-course-${course.id}`}>
                {course.imageUrl && (
                  <div className="w-full h-48 overflow-hidden bg-muted">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {!course.imageUrl && (
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-chart-2">
                        <BookOpen className="h-6 w-6 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      {course.category && (
                        <Badge variant="secondary" className="mt-1">{course.category}</Badge>
                      )}
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

      {filteredRelatedCourses.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold" data-testid="text-related-courses-title">
              Related Courses You Might Like
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Based on your enrolled courses
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRelatedCourses.map((course) => (
              <Card key={course.id} className="hover-elevate overflow-hidden" data-testid={`card-related-course-${course.id}`}>
                {course.imageUrl && (
                  <div className="w-full h-40 overflow-hidden bg-muted">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start gap-3">
                    {!course.imageUrl && (
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-chart-3 to-chart-4">
                        <BookOpen className="h-5 w-5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      {course.category && (
                        <Badge variant="outline" className="mt-1 text-xs">{course.category}</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="line-clamp-3">
                    {course.description}
                  </CardDescription>

                  <Button 
                    size="sm" 
                    className="w-full" 
                    onClick={() => enrollMutation.mutate(course.id)}
                    disabled={enrollMutation.isPending}
                    data-testid={`button-enroll-${course.id}`}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {enrollMutation.isPending ? "Sending..." : "Enroll Now"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
