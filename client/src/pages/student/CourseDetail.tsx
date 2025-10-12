import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  title: string;
  subPoints: string[];
  order: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
}

export default function StudentCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: modules, isLoading: loadingModules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

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
              {modules?.map((module, index) => (
                <div
                  key={module.id}
                  className="p-4 rounded-lg border"
                  data-testid={`module-${module.id}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-medium text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-2">{module.title}</h3>
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
