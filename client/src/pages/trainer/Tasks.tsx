import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  studentId: string;
}

export default function TrainerTasks() {
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/trainer/tasks"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold">Review Tasks</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Student Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tasks && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No tasks to review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border"
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{task.title}</h3>
                    <Badge variant={task.status === 'submitted' ? 'default' : 'secondary'}>
                      {task.status === 'submitted' ? (
                        <><Clock className="h-3 w-3 mr-1" /> Pending</>
                      ) : (
                        <><CheckCircle className="h-3 w-3 mr-1" /> {task.status}</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
