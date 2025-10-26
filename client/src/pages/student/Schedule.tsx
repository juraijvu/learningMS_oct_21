import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

interface ScheduleItem {
  id: string;
  courseTitle: string;
  trainerName: string;
  dayOfWeek: number;
  timeSlot: string;
  weekStart: string;
}

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentSchedule() {
  const { data: schedules, isLoading } = useQuery<ScheduleItem[]>({
    queryKey: ["/api/student/schedule"],
  });

  if (isLoading) {
    return (
      <PageLayout title="My Schedule" subtitle="View your weekly class schedule">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  // Group schedules by day
  const schedulesByDay = schedules?.reduce((acc, schedule) => {
    const day = daysOfWeek[schedule.dayOfWeek];
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>) || {};

  return (
    <PageLayout 
      title="My Schedule" 
      subtitle="View your weekly class schedule"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5" />
            </div>
            This Week's Classes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {Object.keys(schedulesByDay).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-blue-700 font-medium text-lg">No classes scheduled for this week</p>
              <p className="text-sm text-blue-500 mt-1">Your schedule will appear here when classes are assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {daysOfWeek.map((day) => {
                const daySchedules = schedulesByDay[day] || [];
                if (daySchedules.length === 0) return null;

                return (
                  <div key={day} className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                    <h3 className="font-bold text-blue-900 mb-3 text-lg">{day}</h3>
                    <div className="space-y-3">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-white border border-blue-200 hover:shadow-md transition-all duration-300"
                          data-testid={`schedule-${schedule.id}`}
                        >
                          <div className="flex-1 space-y-1">
                            <p className="font-bold text-blue-900">{schedule.courseTitle}</p>
                            <p className="text-sm text-blue-600 flex items-center gap-2">
                              <div className="w-5 h-5 bg-blue-100 rounded-lg flex items-center justify-center">
                                <User className="h-3 w-3 text-blue-600" />
                              </div>
                              Trainer: {schedule.trainerName}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm bg-blue-100 px-3 py-2 rounded-xl">
                            <Clock className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-blue-700">{schedule.timeSlot}</span>
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
    </PageLayout>
  );
}
