import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, User, GraduationCap } from "lucide-react";

interface ScheduleItem {
  id: string;
  courseTitle: string;
  studentName: string;
  trainerName: string;
  dayOfWeek: number;
  timeSlot: string;
  status: string;
}

interface WeeklyCalendarProps {
  schedules: ScheduleItem[];
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WeeklyCalendar({ schedules }: WeeklyCalendarProps) {
  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      paused: "bg-yellow-100 text-yellow-800", 
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800"
    };
    return colors[status as keyof typeof colors] || colors.active;
  };

  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, ScheduleItem[]>);

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Weekly Calendar View</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {daysOfWeek.map((day, index) => {
            const daySchedules = schedulesByDay[index] || [];
            return (
              <div key={day} className="border rounded-lg p-3 min-h-[200px]">
                <h3 className="font-semibold text-sm mb-2 text-center">{day}</h3>
                <div className="space-y-2">
                  {daySchedules.map((schedule) => (
                    <div key={schedule.id} className="bg-blue-50 rounded p-2 text-xs">
                      <div className="font-medium truncate">{schedule.courseTitle}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        <span>{schedule.timeSlot}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <GraduationCap className="h-3 w-3" />
                        <span className="truncate">{schedule.studentName}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{schedule.trainerName}</span>
                      </div>
                      <Badge className={`mt-1 text-xs ${getStatusColor(schedule.status)}`}>
                        {schedule.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}