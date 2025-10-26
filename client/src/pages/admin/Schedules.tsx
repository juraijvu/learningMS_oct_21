import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, GraduationCap, Plus, Edit, Play, Pause, X, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useState } from "react";

interface ScheduleItem {
  id: string;
  courseTitle: string;
  studentName: string;
  trainerName: string;
  dayOfWeek: number;
  timeSlot: string;
  weekStart: string;
  status: 'active' | 'paused' | 'cancelled' | 'completed';
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminSchedules() {
  const { toast } = useToast();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: "default" | "destructive";
  }>({ open: false, title: "", description: "", onConfirm: () => {} });
  
  const { data: schedules, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/admin/schedules"],
  });
  
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/schedules/${id}/status`, { status });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] });
      toast({ 
        title: "Success", 
        description: data.message || "Schedule status updated successfully" 
      });
      setConfirmDialog(prev => ({ ...prev, open: false }));
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update schedule status", variant: "destructive" });
      setConfirmDialog(prev => ({ ...prev, open: false }));
    },
  });
  
  const handleStatusUpdate = (schedule: ScheduleItem, status: string) => {
    const statusMessages = {
      paused: {
        title: "Pause All Schedules",
        description: `This will pause ALL schedules for ${schedule.studentName} in ${schedule.courseTitle}. The student will not see these schedules until resumed.`,
        variant: "default" as const
      },
      active: {
        title: "Resume All Schedules",
        description: `This will resume ALL schedules for ${schedule.studentName} in ${schedule.courseTitle}. The schedules will become visible to the student.`,
        variant: "default" as const
      },
      cancelled: {
        title: "Cancel All Schedules",
        description: `This will cancel ALL schedules for ${schedule.studentName} in ${schedule.courseTitle}. This action affects all related schedules.`,
        variant: "destructive" as const
      },
      completed: {
        title: "Complete All Schedules",
        description: `This will mark ALL schedules as completed for ${schedule.studentName} in ${schedule.courseTitle}. This action affects all related schedules.`,
        variant: "default" as const
      }
    };
    
    const config = statusMessages[status as keyof typeof statusMessages];
    
    setConfirmDialog({
      open: true,
      title: config.title,
      description: config.description,
      variant: config.variant,
      onConfirm: () => updateStatusMutation.mutate({ id: schedule.id, status })
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants = {
      active: { variant: "default" as const, color: "bg-green-500", text: "Active" },
      paused: { variant: "secondary" as const, color: "bg-yellow-500", text: "Paused" },
      cancelled: { variant: "destructive" as const, color: "bg-red-500", text: "Cancelled" },
      completed: { variant: "outline" as const, color: "bg-blue-500", text: "Completed" },
    };
    const config = variants[status as keyof typeof variants] || variants.active;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };
  
  const getStatusActions = (schedule: ScheduleItem) => {
    const actions = [];
    
    if (schedule.status === 'active') {
      actions.push(
        <Button key="pause" size="sm" variant="outline" onClick={() => handleStatusUpdate(schedule, 'paused')}>
          <Pause className="h-3 w-3" />
        </Button>
      );
    }
    
    if (schedule.status === 'paused') {
      actions.push(
        <Button key="resume" size="sm" variant="outline" onClick={() => handleStatusUpdate(schedule, 'active')}>
          <Play className="h-3 w-3" />
        </Button>
      );
    }
    
    if (['active', 'paused'].includes(schedule.status)) {
      actions.push(
        <Button key="cancel" size="sm" variant="outline" onClick={() => handleStatusUpdate(schedule, 'cancelled')}>
          <X className="h-3 w-3" />
        </Button>,
        <Button key="complete" size="sm" variant="outline" onClick={() => handleStatusUpdate(schedule, 'completed')}>
          <CheckCircle className="h-3 w-3" />
        </Button>
      );
    }
    
    return actions;
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const day = daysOfWeek[schedule.dayOfWeek];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>) || {};

  const createButton = (
    <Button asChild className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-create-schedule">
      <Link href="/schedules/create">
        <Plus className="h-5 w-5 mr-2" />
        Create Schedule
      </Link>
    </Button>
  );

  return (
    <PageLayout 
      title="All Schedules" 
      subtitle="Manage weekly class schedules for all students"
      action={createButton}
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-800 text-white p-6">
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            Weekly Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {Object.keys(schedulesByDay).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-blue-500" />
              </div>
              <p className="text-blue-600 font-semibold">No schedules found</p>
              <p className="text-blue-500 text-sm mt-1">Create your first schedule to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const daySchedules = schedulesByDay[day] || [];
                if (daySchedules.length === 0) return null;

                return (
                  <div key={day} className="border border-blue-200 rounded-xl p-6 bg-blue-50/50">
                    <h3 className="font-bold text-blue-900 mb-4 text-lg">{day}</h3>
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white border border-blue-200 shadow-sm hover:shadow-md transition-all duration-200"
                          data-testid={`schedule-${schedule.id}`}
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-blue-900">{schedule.courseTitle}</p>
                              {getStatusBadge(schedule.status)}
                            </div>
                            <div className="flex gap-6 text-sm">
                              <span className="flex items-center gap-2 text-blue-700">
                                <GraduationCap className="h-4 w-4" />
                                {schedule.studentName}
                              </span>
                              <span className="flex items-center gap-2 text-blue-700">
                                <User className="h-4 w-4" />
                                {schedule.trainerName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2 text-blue-600 font-medium bg-blue-100 px-3 py-2 rounded-xl">
                              <Clock className="h-4 w-4" />
                              {schedule.timeSlot}
                            </div>
                            <div className="flex gap-1">
                              {getStatusActions(schedule)}
                              <Button variant="outline" size="sm" asChild className="border-blue-200 text-blue-700 hover:bg-blue-50">
                                <Link href={`/schedules/edit/${schedule.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      
      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        confirmText="Confirm"
        cancelText="Cancel"
      />
    </PageLayout>
  );
}
