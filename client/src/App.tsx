import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/hooks/useAuth";
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
      <Route path="/users" component={AdminUsers} />
      <Route path="/courses" component={AdminCourses} />
      <Route path="/courses/:courseId/modules" component={AdminCourseModules} />
      <Route path="/courses/:courseId/assign" component={AdminAssignTrainers} />
      <Route path="/manage-courses" component={AdminManageCourses} />
      <Route path="/activity-logs" component={AdminActivityLogs} />
      <Route path="/schedules/create" component={AdminCreateSchedule} />
      <Route path="/schedules" component={AdminSchedules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SalesRoutes() {
  return (
    <Switch>
      <Route path="/" component={SalesDashboard} />
      <Route path="/courses" component={SalesCourses} />
      <Route path="/enroll" component={SalesEnrollStudent} />
      <Route path="/students" component={SalesStudents} />
      <Route path="/schedules/create" component={SalesCreateSchedule} />
      <Route path="/schedules" component={SalesSchedules} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TrainerRoutes() {
  return (
    <Switch>
      <Route path="/" component={TrainerDashboard} />
      <Route path="/courses" component={TrainerCourses} />
      <Route path="/courses/:courseId/students" component={TrainerCourseStudents} />
      <Route path="/students" component={TrainerStudents} />
      <Route path="/tasks" component={TrainerTasks} />
      <Route path="/materials" component={TrainerClassMaterials} />
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
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-background sticky top-0 z-10">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto">
            <RoleBasedRoutes />
          </main>
        </div>
      </div>
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
