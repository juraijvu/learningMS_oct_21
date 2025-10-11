import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ClipboardCheck, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TrainerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/trainer/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Trainer Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: "My Courses", value: stats?.myCourses || 0, icon: BookOpen, color: "text-role-trainer" },
    { title: "My Students", value: stats?.myStudents || 0, icon: Users, color: "text-primary" },
    { title: "Pending Tasks", value: stats?.pendingTasks || 0, icon: ClipboardCheck, color: "text-chart-3" },
    { title: "This Week's Classes", value: stats?.weeklySchedules || 0, icon: Calendar, color: "text-chart-4" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-trainer-dashboard-title">Trainer Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Student Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Student activity will appear here...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/courses" className="block p-3 rounded-lg hover-elevate border" data-testid="link-my-courses">
              <p className="font-medium">My Courses</p>
              <p className="text-sm text-muted-foreground">View assigned courses</p>
            </a>
            <a href="/students" className="block p-3 rounded-lg hover-elevate border" data-testid="link-my-students">
              <p className="font-medium">My Students</p>
              <p className="text-sm text-muted-foreground">Track student progress</p>
            </a>
            <a href="/tasks" className="block p-3 rounded-lg hover-elevate border" data-testid="link-review-tasks">
              <p className="font-medium">Review Tasks</p>
              <p className="text-sm text-muted-foreground">Check student submissions</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
