import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

export default function SalesDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/sales/stats"],
  });

  if (isLoading) {
    return (
      <PageLayout title="Sales Dashboard" subtitle="Manage student enrollments and track performance">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-2">
                <Skeleton className="h-4 w-24 bg-white/20" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  const statCards = [
    { title: "My Enrollments", value: stats?.myEnrollments || 0, icon: UserPlus, gradient: "from-blue-600 to-blue-700" },
    { title: "Active Students", value: stats?.activeStudents || 0, icon: Users, gradient: "from-green-600 to-green-700" },
    { title: "Available Courses", value: stats?.totalCourses || 0, icon: BookOpen, gradient: "from-purple-600 to-purple-700" },
    { title: "This Week's Schedules", value: stats?.weeklySchedules || 0, icon: Calendar, gradient: "from-orange-600 to-orange-700" },
  ];

  return (
    <PageLayout 
      title="Sales Dashboard" 
      subtitle="Manage student enrollments and track performance"
      action={
        <Button asChild data-testid="button-enroll-student" className="bg-blue-600 hover:bg-blue-700">
          <a href="/enroll">
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Student
          </a>
        </Button>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${stat.gradient} text-white`}>
              <CardTitle className="flex items-center gap-3 text-lg font-bold">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <stat.icon className="h-5 w-5" />
                </div>
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
              Recent Enrollments
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <UserPlus className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Enrollment tracking coming soon...</p>
                  <p className="text-blue-500">Recent student enrollments will appear here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <a href="/students" className="block p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md" data-testid="link-view-students">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">View All Students</p>
                  <p className="text-sm text-blue-600">Manage student information</p>
                </div>
              </div>
            </a>
            <a href="/courses" className="block p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 hover:shadow-md" data-testid="link-explore-courses">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-purple-900">Explore Courses</p>
                  <p className="text-sm text-purple-600">Browse available courses</p>
                </div>
              </div>
            </a>
            <a href="/schedules" className="block p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:shadow-md" data-testid="link-create-schedule">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-900">Create Schedule</p>
                  <p className="text-sm text-orange-600">Set up class schedules</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
