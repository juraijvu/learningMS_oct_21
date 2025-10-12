import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface Trainer {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AssignTrainers() {
  const { courseId } = useParams<{ courseId: string }>();

  const { data: trainers, isLoading } = useQuery<Trainer[]>({
    queryKey: ["/api/admin/users"],
    select: (users: any[]) => users.filter(u => u.role === 'trainer'),
  });

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
            {trainers?.map((trainer) => (
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
                <Button variant="outline" size="sm">
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
