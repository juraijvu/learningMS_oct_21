import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface Schedule {
  id: string;
  courseTitle: string;
  trainerName: string;
  timeSlot: string;
  dayOfWeek: number;
  weekStart: string;
}

interface Attendance {
  id: string;
  courseTitle: string;
  trainerName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export default function StudentAttendance() {
  const { toast } = useToast();
  const [selectedSchedule, setSelectedSchedule] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<'present' | 'absent' | 'late'>('present');

  const { data: schedules, isLoading: loadingSchedules } = useQuery<Schedule[]>({
    queryKey: ['/api/student/schedule'],
  });

  const { data: attendance, isLoading: loadingAttendance } = useQuery<Attendance[]>({
    queryKey: ['/api/student/attendance'],
  });

  const markAttendanceMutation = useMutation({
    mutationFn: () =>
      apiRequest('/api/student/attendance', {
        method: 'POST',
        body: JSON.stringify({
          scheduleId: selectedSchedule,
          date: new Date(selectedDate).toISOString(),
          status: selectedStatus,
        }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/attendance'] });
      toast({
        title: "Attendance Marked!",
        description: "Your attendance has been recorded.",
      });
      setSelectedSchedule("");
      setSelectedDate("");
      setSelectedStatus('present');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark attendance.",
        variant: "destructive",
      });
    },
  });

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (loadingSchedules) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">My Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark and track your class attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Mark Attendance
          </CardTitle>
          <CardDescription>Select a class and mark your attendance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Class</Label>
            <Select value={selectedSchedule} onValueChange={setSelectedSchedule}>
              <SelectTrigger data-testid="select-schedule">
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {schedules?.map((schedule) => (
                  <SelectItem key={schedule.id} value={schedule.id}>
                    {schedule.courseTitle} - {dayNames[schedule.dayOfWeek]} {schedule.timeSlot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              data-testid="input-date"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as any)}>
              <SelectTrigger data-testid="select-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            className="w-full"
            onClick={() => markAttendanceMutation.mutate()}
            disabled={!selectedSchedule || !selectedDate || !selectedStatus || markAttendanceMutation.isPending}
            data-testid="button-mark-attendance"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {markAttendanceMutation.isPending ? "Marking..." : "Mark Attendance"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance History
          </CardTitle>
          <CardDescription>Your past attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingAttendance ? (
            <Skeleton className="h-20 w-full" />
          ) : attendance && attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No attendance records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance?.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded border"
                  data-testid={`attendance-${record.id}`}
                >
                  <div>
                    <p className="font-medium">{record.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()} • Trainer: {record.trainerName}
                    </p>
                    {record.notes && (
                      <p className="text-xs text-muted-foreground mt-1">Note: {record.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                      {record.status}
                    </Badge>
                    {record.verifiedAt && (
                      <Badge variant="outline" className="bg-green-50 dark:bg-green-900">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
