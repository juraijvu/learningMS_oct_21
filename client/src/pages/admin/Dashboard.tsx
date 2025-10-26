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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          <h1 className="text-4xl font-bold text-blue-900">Admin Dashboard</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-blue-200/50 shadow-lg">
          <div>
            <h1 className="text-4xl font-bold text-blue-900 mb-2" data-testid="text-admin-dashboard-title">Admin Dashboard</h1>
            <p className="text-blue-700 font-medium">Welcome back! Here's what's happening with your learning platform.</p>
          </div>
          <div className="text-right bg-blue-100 rounded-xl p-4">
            <p className="text-sm text-blue-600 font-semibold">Today</p>
            <p className="text-lg font-bold text-blue-800">{new Date().toLocaleDateString()}</p>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, index) => (
            <Card key={stat.title} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <CardTitle className="text-sm font-bold">
                  {stat.title}
                </CardTitle>
                <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-3xl font-bold text-blue-900 mb-2" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
                <p className="text-sm text-blue-600 font-semibold">+12% from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white">
                <CardTitle className="flex items-center gap-3 text-lg font-bold">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-blue-900">New user registered</p>
                      <p className="text-sm text-blue-600 font-medium">2 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-green-50 rounded-xl border border-green-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-green-900">Course completed</p>
                      <p className="text-sm text-green-600 font-medium">15 minutes ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-purple-900">Schedule updated</p>
                      <p className="text-sm text-purple-600 font-medium">1 hour ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white">
              <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <a href="/users" className="block p-4 rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 transition-all duration-300 group border border-blue-200" data-testid="link-manage-users">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-blue-900">Manage Users</p>
                    <p className="text-sm text-blue-700 font-medium">Add or edit accounts</p>
                  </div>
                </div>
              </a>
              <a href="/courses" className="block p-4 rounded-xl bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 transition-all duration-300 group border border-green-200" data-testid="link-manage-courses">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-green-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-900">Manage Courses</p>
                    <p className="text-sm text-green-700 font-medium">Create and organize</p>
                  </div>
                </div>
              </a>
              <a href="/schedules" className="block p-4 rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 transition-all duration-300 group border border-purple-200" data-testid="link-manage-schedules">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-purple-900">Manage Schedules</p>
                    <p className="text-sm text-purple-700 font-medium">Set up weekly plans</p>
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
