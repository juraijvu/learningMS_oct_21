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

// Sales Pages
import SalesDashboard from "@/pages/sales/Dashboard";

// Trainer Pages
import TrainerDashboard from "@/pages/trainer/Dashboard";
import TrainerCourses from "@/pages/trainer/Courses";

// Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import StudentCourses from "@/pages/student/Courses";
import StudentProgress from "@/pages/student/Progress";
import StudentTasks from "@/pages/student/Tasks";
import StudentQueries from "@/pages/student/Queries";
import StudentSchedule from "@/pages/student/Schedule";

// Role-based routing components
function AdminRoutes() {
  return (
    <Switch>
      <Route path="/" component={AdminDashboard} />
      <Route path="/users" component={AdminUsers} />
      <Route path="/courses" component={AdminCourses} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SalesRoutes() {
  return (
    <Switch>
      <Route path="/" component={SalesDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function TrainerRoutes() {
  return (
    <Switch>
      <Route path="/" component={TrainerDashboard} />
      <Route path="/courses" component={TrainerCourses} />
      <Route component={NotFound} />
    </Switch>
  );
}

function StudentRoutes() {
  return (
    <Switch>
      <Route path="/" component={StudentDashboard} />
      <Route path="/courses" component={StudentCourses} />
      <Route path="/progress" component={StudentProgress} />
      <Route path="/tasks" component={StudentTasks} />
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
