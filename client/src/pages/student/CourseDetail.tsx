import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, FileText, CheckCircle, Download, Video, FileIcon } from "lucide-react";
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

interface ClassMaterial {
  id: string;
  type: 'video' | 'note';
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string;
}

export default function StudentCourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });

  const { data: modules, isLoading: loadingModules } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
  });

  const { data: materials, isLoading: loadingMaterials } = useQuery<ClassMaterial[]>({
    queryKey: [`/api/class-materials/${courseId}`],
  });

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const daysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

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

      {materials && materials.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Shared Class Materials
            </CardTitle>
            <CardDescription>
              Videos and notes shared by your trainer. Materials automatically expire after 10 days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingMaterials ? (
              <Skeleton className="h-20 w-full" />
            ) : (
              <div className="space-y-2">
                {materials?.map((material) => {
                  const daysLeft = daysUntilExpiry(material.expiresAt);
                  return (
                    <div
                      key={material.id}
                      className="flex items-center gap-3 p-3 rounded border hover:bg-muted/50 transition-colors"
                      data-testid={`material-${material.id}`}
                    >
                      <div className="flex-shrink-0">
                        {material.type === 'video' ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{material.title}</p>
                        {material.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{material.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(material.fileSize)} • 
                          <span className={daysLeft <= 2 ? "text-destructive font-medium" : ""}>
                            {' '}Expires in {daysLeft} {daysLeft === 1 ? 'day' : 'days'}
                          </span>
                        </p>
                      </div>
                      <Button size="sm" variant="outline" asChild data-testid={`button-download-${material.id}`}>
                        <a href={`/api/class-materials/download/${material.id}`} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
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
