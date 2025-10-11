import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function SalesDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/sales/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-3xl font-semibold">Sales Dashboard</h1>
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
    { title: "My Enrollments", value: stats?.myEnrollments || 0, icon: UserPlus, color: "text-role-sales" },
    { title: "Active Students", value: stats?.activeStudents || 0, icon: Users, color: "text-primary" },
    { title: "Available Courses", value: stats?.totalCourses || 0, icon: BookOpen, color: "text-chart-2" },
    { title: "This Week's Schedules", value: stats?.weeklySchedules || 0, icon: Calendar, color: "text-chart-4" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold" data-testid="text-sales-dashboard-title">Sales Dashboard</h1>
        <Button asChild data-testid="button-enroll-student">
          <a href="/enroll">
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Student
          </a>
        </Button>
      </div>
      
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
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Recent enrollments will appear here...</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a href="/students" className="block p-3 rounded-lg hover-elevate border" data-testid="link-view-students">
              <p className="font-medium">View All Students</p>
              <p className="text-sm text-muted-foreground">Manage student information</p>
            </a>
            <a href="/courses" className="block p-3 rounded-lg hover-elevate border" data-testid="link-explore-courses">
              <p className="font-medium">Explore Courses</p>
              <p className="text-sm text-muted-foreground">Browse available courses</p>
            </a>
            <a href="/schedules" className="block p-3 rounded-lg hover-elevate border" data-testid="link-create-schedule">
              <p className="font-medium">Create Schedule</p>
              <p className="text-sm text-muted-foreground">Set up class schedules</p>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
