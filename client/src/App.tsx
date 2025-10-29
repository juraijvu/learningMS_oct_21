import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { PasswordChangeDialog } from "@/components/PasswordChangeDialog";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { LayoutDashboard, Users, BookOpen, Calendar, User } from "lucide-react";

const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Users", url: "/users", icon: Users },
    { title: "Courses", url: "/courses", icon: BookOpen },
    { title: "Schedules", url: "/schedules", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ],
  sales_consultant: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Students", url: "/students", icon: Users },
    { title: "Courses", url: "/courses", icon: BookOpen },
    { title: "Schedules", url: "/schedules", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ],
  trainer: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Courses", url: "/courses", icon: BookOpen },
    { title: "Students", url: "/students", icon: Users },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ],
  student: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard },
    { title: "Courses", url: "/courses", icon: BookOpen },
    { title: "Progress", url: "/progress", icon: Users },
    { title: "Schedule", url: "/schedule", icon: Calendar },
    { title: "Profile", url: "/profile", icon: User },
  ],
};
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminUsers from "@/pages/admin/Users";
import AdminCourses from "@/pages/admin/Courses";
import AdminSchedules from "@/pages/admin/Schedules";
import AdminCreateSchedule from "@/pages/admin/CreateSchedule";
import AdminCourseModules from "@/pages/admin/CourseModules";
import AdminAssignTrainers from "@/pages/admin/AssignTrainers";
import AdminActivityLogs from "@/pages/admin/ActivityLogs";
import AdminManageCourses from "@/pages/admin/ManageCourses";
import AdminEnrollmentRequests from "@/pages/admin/EnrollmentRequests";
import AdminPostApproval from "@/pages/admin/PostApproval";
import Posts from "@/pages/Posts";
import Profile from "@/pages/Profile";

// Sales Pages
import SalesDashboard from "@/pages/sales/Dashboard";
import SalesSchedules from "@/pages/sales/Schedules";
import SalesCreateSchedule from "@/pages/sales/CreateSchedule";
import SalesEnrollStudent from "@/pages/sales/EnrollStudent";
import SalesStudents from "@/pages/sales/Students";
import SalesCourses from "@/pages/sales/Courses";

// Trainer Pages
import TrainerDashboard from "@/pages/trainer/Dashboard";
import TrainerCourses from "@/pages/trainer/Courses";
import TrainerSchedules from "@/pages/trainer/Schedules";
import TrainerStudents from "@/pages/trainer/Students";
import TrainerTasks from "@/pages/trainer/Tasks";
import TrainerCourseStudents from "@/pages/trainer/CourseStudents";
import TrainerClassMaterials from "@/pages/trainer/ClassMaterials";
import TrainerAttendance from "@/pages/trainer/Attendance";
import TrainerQueries from "@/pages/trainer/Queries";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentCourses from "@/pages/student/Courses";
import StudentProgress from "@/pages/student/Progress";
import StudentTasks from "@/pages/student/Tasks";
import StudentQueries from "@/pages/student/Queries";
import StudentSchedule from "@/pages/student/Schedule";
import StudentCourseDetail from "@/pages/student/CourseDetail";
import StudentMaterials from "@/pages/student/Materials";
import StudentAttendance from "@/pages/student/Attendance";

// Role-based routing components
function AdminRoutes() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/posts" component={Posts} />
      <Route path="/post-approval" component={AdminPostApproval} />
      <Route path="/users" component={AdminUsers} />
      <Route path="/courses" component={AdminCourses} />
      <Route path="/courses/:courseId/modules" component={AdminCourseModules} />
      <Route path="/courses/:courseId/assign" component={AdminAssignTrainers} />
      <Route path="/manage-courses" component={AdminManageCourses} />
      <Route path="/enrollment-requests" component={AdminEnrollmentRequests} />
      <Route path="/activity-logs" component={AdminActivityLogs} />
      <Route path="/schedules/create" component={AdminCreateSchedule} />
      <Route path="/schedules/edit/:id" component={AdminCreateSchedule} />
      <Route path="/schedules" component={AdminSchedules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SalesRoutes() {
  return (
    <Switch>
      <Route path="/" component={SalesDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/posts" component={Posts} />
      <Route path="/courses" component={SalesCourses} />
      <Route path="/enroll" component={SalesEnrollStudent} />
      <Route path="/enrollment-requests" component={AdminEnrollmentRequests} />
      <Route path="/students" component={SalesStudents} />
      <Route path="/schedules/create" component={SalesCreateSchedule} />
      <Route path="/schedules/edit/:id" component={SalesCreateSchedule} />
      <Route path="/schedules" component={SalesSchedules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TrainerRoutes() {
  return (
    <Switch>
      <Route path="/" component={TrainerDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/posts" component={Posts} />
      <Route path="/courses" component={TrainerCourses} />
      <Route path="/courses/:courseId/students" component={TrainerCourseStudents} />
      <Route path="/students" component={TrainerStudents} />
      <Route path="/tasks" component={TrainerTasks} />
      <Route path="/materials" component={TrainerClassMaterials} />
      <Route path="/queries" component={TrainerQueries} />
      <Route path="/attendance" component={TrainerAttendance} />
      <Route path="/schedule" component={TrainerSchedules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function StudentRoutes() {
  return (
    <Switch>
      <Route path="/" component={StudentDashboard} />
      <Route path="/profile" component={Profile} />
      <Route path="/posts" component={Posts} />
      <Route path="/courses" component={StudentCourses} />
      <Route path="/courses/:courseId" component={StudentCourseDetail} />
      <Route path="/progress" component={StudentProgress} />
      <Route path="/tasks" component={StudentTasks} />
      <Route path="/materials" component={StudentMaterials} />
      <Route path="/attendance" component={StudentAttendance} />
      <Route path="/queries" component={StudentQueries} />
      <Route path="/schedule" component={StudentSchedule} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  useEffect(() => {
    if (user && user.mustChangePassword) {
      setShowPasswordChange(true);
    }
  }, [user]);

  // Only show landing if we're loading AND don't have user data yet
  // This prevents flashing landing page when refetching user data
  if ((isLoading && !user) || !isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // Route based on user role
  let RoleBasedRoutes = StudentRoutes;
  if (user?.role === 'admin') RoleBasedRoutes = AdminRoutes;
  else if (user?.role === 'sales_consultant') RoleBasedRoutes = SalesRoutes;
  else if (user?.role === 'trainer') RoleBasedRoutes = TrainerRoutes;

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar className="hidden md:flex" />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-2 md:p-4 border-b bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" className="md:hidden" />
            <h1 className="text-lg md:text-xl font-semibold truncate">{user?.role?.replace('_', ' ').toUpperCase()}</h1>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <RoleBasedRoutes />
          </main>
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-900 border-t border-blue-700">
            <div className="flex justify-around py-2">
              {(menuItems[user?.role as keyof typeof menuItems] || []).slice(0, 5).map((item) => (
                <Link key={item.title} href={item.url} className="flex flex-col items-center p-2 text-blue-100 hover:text-white">
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs mt-1 truncate">{item.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <PasswordChangeDialog 
        isOpen={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        isRequired={user?.mustChangePassword || false}
      />
    </SidebarProvider>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
