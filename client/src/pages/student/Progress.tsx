import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ModuleWithProgress {
  id: string;
  title: string;
  courseTitle: string;
  subPoints: string[];
  isCompleted: boolean;
  completedAt?: string;
}

export default function StudentProgress() {
  const { data: modulesData, isLoading } = useQuery<ModuleWithProgress[]>({
    queryKey: ["/api/student/progress"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const completedModules = modulesData?.filter(m => m.isCompleted) || [];
  const totalModules = modulesData?.length || 0;
  const progressPercentage = totalModules > 0 ? (completedModules.length / totalModules) * 100 : 0;

  // Group modules by course
  const modulesByCourse = modulesData?.reduce((acc, module) => {
    if (!acc[module.courseTitle]) {
      acc[module.courseTitle] = [];
    }
    acc[module.courseTitle].push(module);
    return acc;
  }, {} as Record<string, ModuleWithProgress[]>) || {};

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-progress-title">My Progress</h1>

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Modules Completed</span>
            <span className="font-medium text-lg">{completedModules.length} / {totalModules}</span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <p className="text-sm text-muted-foreground text-right">{Math.round(progressPercentage)}% Complete</p>
        </CardContent>
      </Card>

      {Object.keys(modulesByCourse).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No modules to track yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(modulesByCourse).map(([courseTitle, modules]) => {
            const courseCompleted = modules.filter(m => m.isCompleted).length;
            const courseTotal = modules.length;
            const courseProgress = (courseCompleted / courseTotal) * 100;

            return (
              <Card key={courseTitle}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{courseTitle}</CardTitle>
                    <span className="text-sm text-muted-foreground">
                      {courseCompleted} / {courseTotal} modules
                    </span>
                  </div>
                  <Progress value={courseProgress} className="h-2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {modules.map((module, index) => (
                      <AccordionItem value={module.id} key={module.id}>
                        <AccordionTrigger className="hover:no-underline" data-testid={`module-${module.id}`}>
                          <div className="flex items-center gap-3 text-left">
                            {module.isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-chart-2 flex-shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                            )}
                            <div>
                              <p className="font-medium">{module.title}</p>
                              {module.completedAt && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Completed: {new Date(module.completedAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-8 pr-4 pb-2">
                            {module.subPoints.length > 0 ? (
                              <ul className="space-y-2 text-sm">
                                {module.subPoints.map((point, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-muted-foreground mt-0.5">•</span>
                                    <span className="text-muted-foreground">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-sm text-muted-foreground">No sub-points available</p>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
