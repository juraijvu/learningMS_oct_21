import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface TrainerAssignment {
  trainerId: string;
  courseId: string;
}

export default function AssignTrainers() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const [assignedTrainers, setAssignedTrainers] = useState<Set<string>>(new Set());

  const { data: trainers, isLoading } = useQuery<Trainer[]>({
    queryKey: ["/api/admin/users"],
    select: (users: any[]) => users.filter(u => u.role === 'trainer'),
  });

  const assignMutation = useMutation({
    mutationFn: async (data: TrainerAssignment) => {
      return apiRequest('POST', '/api/admin/trainer-assignments', data);
    },
    onSuccess: (_, variables) => {
      setAssignedTrainers(prev => new Set(prev).add(variables.trainerId));
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/courses'] });
      toast({
        title: "Success",
        description: "Trainer assigned to course successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Assignment Failed",
        description: error.message || "Failed to assign trainer",
        variant: "destructive",
      });
    },
  });

  const handleAssign = (trainerId: string) => {
    if (!courseId) return;
    assignMutation.mutate({ trainerId, courseId });
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
        <h1 className="text-3xl font-semibold">Assign Trainers</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Trainers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainers?.map((trainer) => {
              const isAssigned = assignedTrainers.has(trainer.id);
              const isPending = assignMutation.isPending && assignMutation.variables?.trainerId === trainer.id;
              
              return (
                <div
                  key={trainer.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                  data-testid={`trainer-${trainer.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{trainer.firstName} {trainer.lastName}</p>
                      <p className="text-sm text-muted-foreground">{trainer.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant={isAssigned ? "default" : "outline"} 
                    size="sm"
                    onClick={() => handleAssign(trainer.id)}
                    disabled={isPending || isAssigned}
                    data-testid={`button-assign-${trainer.id}`}
                  >
                    {isPending ? "Assigning..." : isAssigned ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Assigned
                      </>
                    ) : "Assign"}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
