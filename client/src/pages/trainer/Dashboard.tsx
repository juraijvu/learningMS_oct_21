import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, ClipboardCheck, Calendar, TrendingUp, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

export default function TrainerDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/trainer/stats"],
  });

  if (isLoading) {
    return (
      <PageLayout title="Trainer Dashboard" subtitle="Manage your courses and track student progress">
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
    { title: "My Courses", value: stats?.myCourses || 0, icon: BookOpen, gradient: "from-blue-600 to-blue-700" },
    { title: "My Students", value: stats?.myStudents || 0, icon: Users, gradient: "from-green-600 to-green-700" },
    { title: "Pending Tasks", value: stats?.pendingTasks || 0, icon: ClipboardCheck, gradient: "from-orange-600 to-orange-700" },
    { title: "This Week's Classes", value: stats?.weeklySchedules || 0, icon: Calendar, gradient: "from-purple-600 to-purple-700" },
  ];

  return (
    <PageLayout 
      title="Trainer Dashboard" 
      subtitle="Manage your courses and track student progress"
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
              Recent Student Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">Activity tracking coming soon...</p>
                  <p className="text-blue-500">Student progress and submissions will appear here</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <a href="/courses" className="block p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md" data-testid="link-my-courses">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">My Courses</p>
                  <p className="text-sm text-blue-600">View assigned courses</p>
                </div>
              </div>
            </a>
            <a href="/students" className="block p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-md" data-testid="link-my-students">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900">My Students</p>
                  <p className="text-sm text-green-600">Track student progress</p>
                </div>
              </div>
            </a>
            <a href="/tasks" className="block p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:shadow-md" data-testid="link-review-tasks">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <ClipboardCheck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-900">Review Tasks</p>
                  <p className="text-sm text-orange-600">Check student submissions</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
