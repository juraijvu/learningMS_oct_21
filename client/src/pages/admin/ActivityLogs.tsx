import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, User, Clock, FileText } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type ActivityLog = {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  targetUserId?: string;
  details?: any;
  ipAddress?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  targetUser?: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
};

const actionLabels: Record<string, string> = {
  login: "Logged in",
  logout: "Logged out",
  course_created: "Created course",
  course_assigned_to_trainer: "Assigned course to trainer",
  student_enrolled: "Enrolled student",
  material_uploaded: "Uploaded material",
  material_assigned: "Assigned material",
  task_created: "Created task",
  task_submitted: "Submitted task",
  task_reviewed: "Reviewed task",
  query_created: "Created query",
  query_resolved: "Resolved query",
  module_completed: "Completed module",
  user_created: "Created user",
};

const actionColors: Record<string, string> = {
  login: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  logout: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  course_created: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  course_assigned_to_trainer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  student_enrolled: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  material_uploaded: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  material_assigned: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  task_created: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  task_submitted: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  task_reviewed: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  query_created: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  query_resolved: "bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-200",
  module_completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  user_created: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-200",
};

function getUserDisplay(user?: { username: string; firstName?: string; lastName?: string }) {
  if (!user) return "Unknown User";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return fullName || user.username;
}

export default function ActivityLogs() {
  const { data: logs, isLoading } = useQuery<ActivityLog[]>({
    queryKey: ["/api/admin/activity-logs"],
  });

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-activity-logs">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="heading-activity-logs">
            Activity Logs
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitor all user activities across the platform
          </p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Recent Activities
            </h2>
            {logs && (
              <Badge variant="outline" className="text-xs">
                {logs.length} activities shown
              </Badge>
            )}
          </div>

          {isLoading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading activities...</p>
            </div>
          )}

          {!isLoading && logs && logs.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No activity logs yet</p>
            </div>
          )}

          {!isLoading && logs && logs.length > 0 && (
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-3 pr-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    data-testid={`activity-log-${log.id}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge 
                            className={actionColors[log.action] || "bg-gray-100 text-gray-800"}
                            data-testid={`badge-action-${log.action}`}
                          >
                            {actionLabels[log.action] || log.action}
                          </Badge>
                          
                          {log.user && (
                            <div className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-medium">{getUserDisplay(log.user)}</span>
                              <Badge variant="outline" className="text-xs">
                                {log.user.role.replace('_', ' ')}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {log.targetUser && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <span>→ affecting</span>
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {getUserDisplay(log.targetUser)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.targetUser.role.replace('_', ' ')}
                            </Badge>
                          </div>
                        )}

                        {log.details && (
                          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              {log.details.courseName && (
                                <div>Course: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.courseName}</span></div>
                              )}
                              {log.details.materialTitle && (
                                <div>Material: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.materialTitle}</span></div>
                              )}
                              {log.details.materialType && (
                                <div>Type: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.materialType}</span></div>
                              )}
                              {log.details.taskTitle && (
                                <div>Task: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.taskTitle}</span></div>
                              )}
                              {log.details.status && (
                                <div>Status: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.status}</span></div>
                              )}
                              {log.details.username && (
                                <div>Username: <span className="font-medium text-gray-900 dark:text-gray-100">{log.details.username}</span></div>
                              )}
                            </div>
                          </div>
                        )}

                        {log.ipAddress && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">
                            IP: {log.ipAddress}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-500 flex-shrink-0">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="whitespace-nowrap">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>
    </div>
  );
}
