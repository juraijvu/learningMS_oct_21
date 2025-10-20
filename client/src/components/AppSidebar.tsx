import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  ClipboardList,
  UserPlus,
  GraduationCap,
  MessageSquare,
  FileText,
  Activity,
  Settings
} from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "./UserAvatar";
import { RoleBadge } from "./RoleBadge";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-admin-dashboard" },
    { title: "Users", url: "/users", icon: Users, testId: "link-admin-users" },
    { title: "Courses", url: "/courses", icon: BookOpen, testId: "link-admin-courses" },
    { title: "Manage Courses", url: "/manage-courses", icon: Settings, testId: "link-admin-manage-courses" },
    { title: "Activity Logs", url: "/activity-logs", icon: Activity, testId: "link-admin-activity-logs" },
    { title: "Schedules", url: "/schedules", icon: Calendar, testId: "link-admin-schedules" },
  ],
  sales_consultant: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-sales-dashboard" },
    { title: "Students", url: "/students", icon: Users, testId: "link-sales-students" },
    { title: "Enroll Student", url: "/enroll", icon: UserPlus, testId: "link-sales-enroll" },
    { title: "Courses", url: "/courses", icon: BookOpen, testId: "link-sales-courses" },
    { title: "Schedules", url: "/schedules", icon: Calendar, testId: "link-sales-schedules" },
  ],
  trainer: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-trainer-dashboard" },
    { title: "My Courses", url: "/courses", icon: BookOpen, testId: "link-trainer-courses" },
    { title: "Students", url: "/students", icon: Users, testId: "link-trainer-students" },
    { title: "Tasks", url: "/tasks", icon: ClipboardList, testId: "link-trainer-tasks" },
    { title: "Class Materials", url: "/materials", icon: FileText, testId: "link-trainer-materials" },
    { title: "Schedule", url: "/schedule", icon: Calendar, testId: "link-trainer-schedule" },
  ],
  student: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-student-dashboard" },
    { title: "My Courses", url: "/courses", icon: BookOpen, testId: "link-student-courses" },
    { title: "Progress", url: "/progress", icon: GraduationCap, testId: "link-student-progress" },
    { title: "Tasks", url: "/tasks", icon: ClipboardList, testId: "link-student-tasks" },
    { title: "Class Materials", url: "/materials", icon: FileText, testId: "link-student-materials" },
    { title: "Queries", url: "/queries", icon: MessageSquare, testId: "link-student-queries" },
    { title: "Schedule", url: "/schedule", icon: Calendar, testId: "link-student-schedule" },
  ],
};

export function AppSidebar() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      // Clear user data immediately and redirect to login
      queryClient.setQueryData(['/api/auth/user'], null);
      queryClient.removeQueries({ queryKey: ['/api/auth/user'] });
      setLocation('/');
    },
  });
  
  if (!user) return null;

  const items = menuItems[user.role as keyof typeof menuItems] || [];

  return (
    <Sidebar>
      <SidebarHeader className="p-4 border-b">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} className="h-10 w-10" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user.firstName} {user.lastName}
            </p>
            <RoleBadge role={user.role as any} showIcon={false} />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          {logoutMutation.isPending ? "Signing out..." : "Sign Out"}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
