import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BookOpen, ArrowLeft, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Module {
  id: string;
  title: string;
  subPoints: string[];
  order: number;
}

export default function CourseModules() {
  const { courseId } = useParams<{ courseId: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newModule, setNewModule] = useState({ title: "", subPoints: "" });
  const { toast } = useToast();

  const { data: modules, isLoading } = useQuery<Module[]>({
    queryKey: [`/api/admin/courses/${courseId}/modules`],
  });

  const createModuleMutation = useMutation({
    mutationFn: async (moduleData: { title: string; subPoints: string[] }) => {
      return await apiRequest("POST", `/api/admin/courses/${courseId}/modules`, moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${courseId}/modules`] });
      toast({ title: "Success", description: "Module created successfully" });
      setIsDialogOpen(false);
      setNewModule({ title: "", subPoints: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleCreateModule = () => {
    const subPoints = newModule.subPoints
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    createModuleMutation.mutate({
      title: newModule.title,
      subPoints,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-40 w-full" />
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
        <h1 className="text-3xl font-semibold">Manage Course Modules</h1>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Add and organize course modules</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-module">
              <Plus className="mr-2 h-4 w-4" />
              Add Module
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Module</DialogTitle>
              <DialogDescription>Add a new module to the course</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Module Title</Label>
                <Input
                  id="title"
                  value={newModule.title}
                  onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                  data-testid="input-module-title"
                  placeholder="e.g., Introduction to Variables"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subPoints">Sub-points (one per line)</Label>
                <textarea
                  id="subPoints"
                  value={newModule.subPoints}
                  onChange={(e) => setNewModule({ ...newModule, subPoints: e.target.value })}
                  data-testid="input-module-subpoints"
                  placeholder="What is a variable&#10;Types of variables&#10;Variable declaration"
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleCreateModule}
                disabled={createModuleMutation.isPending}
                data-testid="button-submit-module"
              >
                {createModuleMutation.isPending ? "Creating..." : "Create Module"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {modules && modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No modules created yet</p>
            <p className="text-sm text-muted-foreground text-center mt-1">Add your first module to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {modules?.map((module, index) => (
            <Card key={module.id} data-testid={`card-module-${module.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Module {index + 1}</Badge>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                    </div>
                    {module.subPoints && module.subPoints.length > 0 && (
                      <ul className="mt-3 space-y-1">
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
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
