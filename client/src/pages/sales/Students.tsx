import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
}

export default function SalesStudents() {
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/admin/users"],
    select: (users: any[]) => users.filter(u => u.role === 'student'),
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
      <h1 className="text-3xl font-semibold">Students</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            All Students
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {students?.map((student) => (
              <div
                key={student.id}
                className="flex items-center gap-4 p-4 rounded-lg border"
                data-testid={`student-${student.id}`}
              >
                <UserAvatar user={student as any} className="h-12 w-12" />
                <div className="flex-1">
                  <p className="font-medium">{student.firstName} {student.lastName}</p>
                  <p className="text-sm text-muted-foreground">{student.email}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
