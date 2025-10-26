import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, ClipboardList, CheckCircle, Calendar, TrendingUp, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

export default function StudentDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  if (isLoading) {
    return (
      <PageLayout title="My Dashboard" subtitle="Track your learning progress and access course materials">
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
    { title: "Enrolled Courses", value: stats?.enrolledCourses || 0, icon: BookOpen, gradient: "from-blue-600 to-blue-700" },
    { title: "Completed Modules", value: stats?.completedModules || 0, icon: CheckCircle, gradient: "from-green-600 to-green-700" },
    { title: "Pending Tasks", value: stats?.pendingTasks || 0, icon: ClipboardList, gradient: "from-orange-600 to-orange-700" },
    { title: "This Week's Classes", value: stats?.weeklySchedules || 0, icon: Calendar, gradient: "from-purple-600 to-purple-700" },
  ];

  const overallProgress = stats?.completedModules && stats?.totalModules 
    ? (stats.completedModules / stats.totalModules) * 100 
    : 0;

  return (
    <PageLayout 
      title="My Dashboard" 
      subtitle="Track your learning progress and access course materials"
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

      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden mb-6">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-600 font-medium">Completion Rate</span>
            <span className="font-bold text-blue-900 text-lg">{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5" />
              </div>
              My Courses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <a href="/courses" className="block p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md" data-testid="link-view-courses">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-blue-900">View All Courses</p>
                  <p className="text-sm text-blue-600">Access course materials and PDFs</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardTitle className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <ClipboardList className="h-5 w-5" />
              </div>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-3">
            <a href="/tasks" className="block p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 hover:from-orange-100 hover:to-amber-100 transition-all duration-300 hover:shadow-md" data-testid="link-view-tasks">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-orange-900">My Tasks</p>
                  <p className="text-sm text-orange-600">Submit pending assignments</p>
                </div>
              </div>
            </a>
            <a href="/progress" className="block p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:from-green-100 hover:to-emerald-100 transition-all duration-300 hover:shadow-md" data-testid="link-view-progress">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-green-900">Track Progress</p>
                  <p className="text-sm text-green-600">View completed modules</p>
                </div>
              </div>
            </a>
            <a href="/queries" className="block p-4 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-200 hover:from-purple-100 hover:to-violet-100 transition-all duration-300 hover:shadow-md" data-testid="link-view-queries">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-bold text-purple-900">Ask Questions</p>
                  <p className="text-sm text-purple-600">Submit doubts and queries</p>
                </div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
