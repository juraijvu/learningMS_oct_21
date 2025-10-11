import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User, GraduationCap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleItem {
  id: string;
  courseTitle: string;
  studentName: string;
  trainerName: string;
  dayOfWeek: number;
  timeSlot: string;
  weekStart: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminSchedules() {
  const { data: schedules, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/admin/schedules"],
  });

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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-semibold" data-testid="text-schedules-title">All Schedules</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Weekly Schedule Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(schedulesByDay).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No schedules found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const daySchedules = schedulesByDay[day] || [];
                if (daySchedules.length === 0) return null;

                return (
                  <div key={day} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-3">{day}</h3>
                    <div className="space-y-2">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted"
                          data-testid={`schedule-${schedule.id}`}
                        >
                          <div className="flex-1 space-y-1">
                            <p className="font-medium">{schedule.courseTitle}</p>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {schedule.studentName}
                              </span>
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {schedule.trainerName}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {schedule.timeSlot}
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
    </div>
  );
}
