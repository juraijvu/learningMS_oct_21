import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

type Course = {
  id: string;
  title: string;
  description: string;
  duration: string;
  level: string;
  createdAt: string;
};

export default function SalesCourses() {
  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  if (isLoading) {
    return (
      <PageLayout title="Available Courses" subtitle="Browse all available courses to enroll students">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Skeleton className="h-6 w-3/4 bg-white/20" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Available Courses" 
      subtitle="Browse all available courses to enroll students"
    >
      {courses && courses.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-lg font-bold text-blue-900 mb-2">No courses available</p>
            <p className="text-sm text-blue-600">
              Check back later for new courses
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <Card key={course.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300" data-testid={`card-course-${course.id}`}>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/30" data-testid={`badge-level-${course.id}`}>
                    {course.level}
                  </Badge>
                </div>
                <CardTitle className="mt-4 text-white" data-testid={`title-course-${course.id}`}>
                  {course.title}
                </CardTitle>
                <CardDescription className="text-blue-100" data-testid={`description-course-${course.id}`}>
                  {course.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-xl">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-700 font-medium" data-testid={`duration-course-${course.id}`}>{course.duration}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
