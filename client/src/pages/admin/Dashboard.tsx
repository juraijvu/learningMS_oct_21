import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Calendar, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
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
    { title: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "text-primary" },
    { title: "Total Courses", value: stats?.totalCourses || 0, icon: BookOpen, color: "text-chart-2" },
    { title: "Active Students", value: stats?.activeStudents || 0, icon: GraduationCap, color: "text-chart-3" },
    { title: "Schedules This Week", value: stats?.weeklySchedules || 0, icon: Calendar, color: "text-chart-4" },
  ];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
      
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
              <div className="text-2xl font-bold" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                {stat.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Activity tracking coming soon...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/users" className="block p-3 rounded-lg hover-elevate border" data-testid="link-manage-users">
              <p className="font-medium">Manage Users</p>
              <p className="text-sm text-muted-foreground">Add or edit user accounts</p>
            </a>
            <a href="/courses" className="block p-3 rounded-lg hover-elevate border" data-testid="link-manage-courses">
              <p className="font-medium">Manage Courses</p>
              <p className="text-sm text-muted-foreground">Create and organize courses</p>
            </a>
            <a href="/schedules" className="block p-3 rounded-lg hover-elevate border" data-testid="link-manage-schedules">
              <p className="font-medium">Manage Schedules</p>
              <p className="text-sm text-muted-foreground">Set up weekly schedules</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
