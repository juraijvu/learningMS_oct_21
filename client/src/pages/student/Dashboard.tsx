import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, CheckCircle, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function StudentDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold">My Dashboard</h1>
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
    { title: "Enrolled Courses", value: stats?.enrolledCourses || 0, icon: BookOpen, color: "text-primary" },
    { title: "Completed Modules", value: stats?.completedModules || 0, icon: CheckCircle, color: "text-chart-2" },
    { title: "Pending Tasks", value: stats?.pendingTasks || 0, icon: ClipboardList, color: "text-chart-3" },
    { title: "This Week's Classes", value: stats?.weeklySchedules || 0, icon: Calendar, color: "text-chart-4" },
  ];

  const overallProgress = stats?.completedModules && stats?.totalModules 
    ? (stats.completedModules / stats.totalModules) * 100 
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-student-dashboard-title">My Dashboard</h1>
      
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

      <Card>
        <CardHeader>
          <CardTitle>Overall Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Completion Rate</span>
            <span className="font-medium">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <a href="/courses" className="block p-3 rounded-lg hover-elevate border" data-testid="link-view-courses">
              <p className="font-medium">View All Courses</p>
              <p className="text-sm text-muted-foreground">Access course materials and PDFs</p>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/tasks" className="block p-3 rounded-lg hover-elevate border" data-testid="link-view-tasks">
              <p className="font-medium">My Tasks</p>
              <p className="text-sm text-muted-foreground">Submit pending assignments</p>
            </a>
            <a href="/progress" className="block p-3 rounded-lg hover-elevate border" data-testid="link-view-progress">
              <p className="font-medium">Track Progress</p>
              <p className="text-sm text-muted-foreground">View completed modules</p>
            </a>
            <a href="/queries" className="block p-3 rounded-lg hover-elevate border" data-testid="link-view-queries">
              <p className="font-medium">Ask Questions</p>
              <p className="text-sm text-muted-foreground">Submit doubts and queries</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
