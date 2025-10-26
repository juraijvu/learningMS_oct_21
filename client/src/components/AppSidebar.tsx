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
  Settings,
  UserCheck,
  Hash,
  User
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
import myLogo from '../orbit-logo.png';

// Add custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(30, 58, 138, 0.3);
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.6);
    border-radius: 4px;
    border: 1px solid rgba(30, 58, 138, 0.5);
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(59, 130, 246, 0.8);
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(59, 130, 246, 0.6) rgba(30, 58, 138, 0.3);
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('sidebar-scrollbar-styles')) {
  const style = document.createElement('style');
  style.id = 'sidebar-scrollbar-styles';
  style.textContent = scrollbarStyles;
  document.head.appendChild(style);
} 

const menuItems = {
  admin: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-admin-dashboard" },
    { title: "Profile", url: "/profile", icon: User, testId: "link-admin-profile" },
    { title: "Posts", url: "/posts", icon: Hash, testId: "link-admin-posts" },
    { title: "Post Approval", url: "/post-approval", icon: UserCheck, testId: "link-admin-post-approval" },
    { title: "Users", url: "/users", icon: Users, testId: "link-admin-users" },
    { title: "Courses", url: "/courses", icon: BookOpen, testId: "link-admin-courses" },
    { title: "Manage Courses", url: "/manage-courses", icon: Settings, testId: "link-admin-manage-courses" },
    { title: "Enrollment Requests", url: "/enrollment-requests", icon: UserCheck, testId: "link-admin-enrollment-requests" },
    { title: "Activity Logs", url: "/activity-logs", icon: Activity, testId: "link-admin-activity-logs" },
    { title: "Schedules", url: "/schedules", icon: Calendar, testId: "link-admin-schedules" },
  ],
  sales_consultant: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-sales-dashboard" },
    { title: "Profile", url: "/profile", icon: User, testId: "link-sales-profile" },
    { title: "Posts", url: "/posts", icon: Hash, testId: "link-sales-posts" },
    { title: "Students", url: "/students", icon: Users, testId: "link-sales-students" },
    { title: "Enroll Student", url: "/enroll", icon: UserPlus, testId: "link-sales-enroll" },
    { title: "Enrollment Requests", url: "/enrollment-requests", icon: UserCheck, testId: "link-sales-enrollment-requests" },
    { title: "Courses", url: "/courses", icon: BookOpen, testId: "link-sales-courses" },
    { title: "Schedules", url: "/schedules", icon: Calendar, testId: "link-sales-schedules" },
  ],
  trainer: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-trainer-dashboard" },
    { title: "Profile", url: "/profile", icon: User, testId: "link-trainer-profile" },
    { title: "Posts", url: "/posts", icon: Hash, testId: "link-trainer-posts" },
    { title: "My Courses", url: "/courses", icon: BookOpen, testId: "link-trainer-courses" },
    { title: "Students", url: "/students", icon: Users, testId: "link-trainer-students" },
    { title: "Tasks", url: "/tasks", icon: ClipboardList, testId: "link-trainer-tasks" },
    { title: "Class Materials", url: "/materials", icon: FileText, testId: "link-trainer-materials" },
    { title: "Queries", url: "/queries", icon: MessageSquare, testId: "link-trainer-queries" },
    { title: "Schedule", url: "/schedule", icon: Calendar, testId: "link-trainer-schedule" },
  ],
  student: [
    { title: "Dashboard", url: "/", icon: LayoutDashboard, testId: "link-student-dashboard" },
    { title: "Profile", url: "/profile", icon: User, testId: "link-student-profile" },
    { title: "Posts", url: "/posts", icon: Hash, testId: "link-student-posts" },
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
    <Sidebar 
      className="bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 border-r border-blue-700/50 custom-scrollbar"
      style={{ 
        background: 'linear-gradient(to bottom, #1e3a8a, #1e40af, #1e3a8a)', 
        backgroundColor: '#1e3a8a',
        '--scrollbar-width': '8px',
        '--scrollbar-track': 'rgba(30, 58, 138, 0.3)',
        '--scrollbar-thumb': 'rgba(59, 130, 246, 0.6)',
        '--scrollbar-thumb-hover': 'rgba(59, 130, 246, 0.8)'
      } as React.CSSProperties & { [key: string]: string }}
    >
      <SidebarHeader className="p-6 border-b border-blue-700/50" style={{ background: 'linear-gradient(to bottom, #1e3a8a, #1e40af, #1e3a8a)', backgroundColor: '#1e3a8a' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <img src={myLogo} className="w-16 h-16 object-contain" alt="Logo" />
          </div>
          <div className="text-center">
            <h2 className="text-white font-bold text-xl">Orbit LMS</h2>
            <p className="text-blue-100 text-sm font-medium">Learning Management</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-4 py-6" style={{ background: 'linear-gradient(to bottom, #1e3a8a, #1e40af, #1e3a8a)', backgroundColor: '#1e3a8a' }}>
        <div className="mb-6">
          <div className="flex items-center gap-3 p-4 bg-blue-800/60 rounded-xl border border-blue-600/40 backdrop-blur-sm">
            <UserAvatar user={user} className="h-12 w-12 border-2 border-blue-300" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate" data-testid="text-user-name">
                {user.firstName} {user.lastName}
              </p>
              <div className="mt-1">
                <RoleBadge role={user.role as any} showIcon={false} />
              </div>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-100 font-bold text-xs uppercase tracking-wider mb-4">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-2">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="group">
                    <Link 
                      href={item.url} 
                      data-testid={item.testId}
                      className="flex items-center gap-3 px-4 py-3 text-blue-100 hover:text-blue-200 hover:bg-blue-700/60 rounded-xl transition-all duration-300 group-hover:translate-x-2 group-hover:shadow-lg"
                    >
                      <div className="w-9 h-9 flex items-center justify-center bg-blue-700/60 rounded-xl group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-300">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="font-semibold group-hover:text-lg group-hover:text-blue-200 transition-all duration-300">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-blue-700/50" style={{ background: 'linear-gradient(to bottom, #1e3a8a, #1e40af, #1e3a8a)', backgroundColor: '#1e3a8a' }}>
        <Button
          variant="outline"
          className="w-full justify-start gap-3 bg-red-600/30 border-red-500/60 text-red-300 hover:text-white hover:bg-red-600/50 hover:border-red-400 transition-all duration-300 font-semibold"
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
