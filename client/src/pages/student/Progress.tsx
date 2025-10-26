import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, BookOpen, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { PageLayout } from "@/components/PageLayout";

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
      <PageLayout title="My Progress" subtitle="Track your learning journey and module completion">
        <div className="space-y-6">
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <Skeleton className="h-6 w-48 bg-white/20" />
            </CardHeader>
            <CardContent className="p-6">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
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
    <PageLayout 
      title="My Progress" 
      subtitle="Track your learning journey and module completion"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-600 font-medium">Modules Completed</span>
            <span className="font-bold text-blue-900 text-xl">{completedModules.length} / {totalModules}</span>
          </div>
          <Progress value={progressPercentage} className="h-4" />
          <p className="text-sm text-blue-600 text-right font-medium">{Math.round(progressPercentage)}% Complete</p>
        </CardContent>
      </Card>

      {Object.keys(modulesByCourse).length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-blue-600" />
            </div>
            <p className="text-blue-700 font-medium text-lg">No modules to track yet</p>
            <p className="text-sm text-blue-500 mt-1">Start learning to see your progress here</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(modulesByCourse).map(([courseTitle, modules]) => {
            const courseCompleted = modules.filter(m => m.isCompleted).length;
            const courseTotal = modules.length;
            const courseProgress = (courseCompleted / courseTotal) * 100;

            return (
              <Card key={courseTitle} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white flex items-center gap-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      {courseTitle}
                    </CardTitle>
                    <span className="text-sm text-blue-100 font-medium">
                      {courseCompleted} / {courseTotal} modules
                    </span>
                  </div>
                  <Progress value={courseProgress} className="h-2 mt-3" />
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
    </PageLayout>
  );
}
