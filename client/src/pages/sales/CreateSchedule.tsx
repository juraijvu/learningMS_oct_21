import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { generateTimeSlots, isValidTimeSlot } from "@/lib/timeSlots";

const scheduleSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  studentId: z.string().min(1, "Student is required"),
  trainerId: z.string().min(1, "Trainer is required"),
  weekStart: z.string().min(1, "Week start date is required"),
  daysOfWeek: z.array(z.number()).min(1, "At least one day must be selected").max(3, "Maximum 3 days allowed"),
  timeSlot: z.string().min(1, "Time slot is required").refine(isValidTimeSlot, {
    message: "Invalid time slot format or time range"
  }),
});

interface Course {
  id: string;
  title: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function SalesCreateSchedule() {
  const { toast } = useToast();
  const params = useParams();
  const scheduleId = params.id;
  const isEditing = !!scheduleId;
  const timeSlots = generateTimeSlots();

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
  });

  const { data: students } = useQuery<User[]>({
    queryKey: ['/api/admin/students'],
  });

  const { data: trainers } = useQuery<User[]>({
    queryKey: ['/api/admin/trainers'],
  });

  const { data: existingSchedule } = useQuery({
    queryKey: [`/api/sales/schedules/${scheduleId}`],
    enabled: isEditing && !!scheduleId,
  });

  const form = useForm<z.infer<typeof scheduleSchema>>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      courseId: "",
      studentId: "",
      trainerId: "",
      weekStart: "",
      daysOfWeek: [],
      timeSlot: "",
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof scheduleSchema>) => {
      if (isEditing) {
        // Update existing schedule
        return await apiRequest(`/api/sales/schedules/${scheduleId}`, {
          method: "PUT",
          body: {
            courseId: data.courseId,
            studentId: data.studentId,
            trainerId: data.trainerId,
            weekStart: data.weekStart,
            dayOfWeek: data.daysOfWeek[0], // Take first selected day for single schedule
            timeSlot: data.timeSlot,
          },
        });
      } else {
        // Create multiple schedule entries for each selected day
        const schedules = await Promise.all(
          data.daysOfWeek.map(async (dayOfWeek) => {
            return await apiRequest("/api/sales/schedules", {
              method: "POST",
              body: {
                courseId: data.courseId,
                studentId: data.studentId,
                trainerId: data.trainerId,
                weekStart: data.weekStart,
                dayOfWeek,
                timeSlot: data.timeSlot,
              },
            });
          })
        );
        return schedules;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales/schedules'] });
      toast({
        title: "Success!",
        description: isEditing ? "Schedule updated successfully." : "Schedule created successfully.",
      });
      if (!isEditing) form.reset();
    },
    onError: (error: any) => {
      const errorMessage = error.message || (isEditing ? "Failed to update schedule." : "Failed to create schedule.");
      toast({
        title: error.message?.includes("Trainer is busy") ? "Scheduling Conflict" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof scheduleSchema>) => {
    createScheduleMutation.mutate(data);
  };

  // Prefill form when editing
  useEffect(() => {
    if (existingSchedule && isEditing) {
      form.reset({
        courseId: existingSchedule.courseId,
        studentId: existingSchedule.studentId,
        trainerId: existingSchedule.trainerId,
        weekStart: existingSchedule.weekStart,
        daysOfWeek: [existingSchedule.dayOfWeek],
        timeSlot: existingSchedule.timeSlot,
      });
    }
  }, [existingSchedule, isEditing, form]);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/schedules" data-testid="button-back">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-semibold">{isEditing ? 'Edit Schedule' : 'Create Schedule'}</h1>
          <p className="text-muted-foreground mt-1">{isEditing ? 'Update the class schedule' : 'Add a new class schedule'}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Schedule Details
          </CardTitle>
          <CardDescription>
            Fill in the details for the new schedule. Multiple students can be scheduled for the same course at the same time (batch scheduling).
          </CardDescription>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Scheduling Rules:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Classes are 2 hours long with 20-minute interval start times</li>
                  <li>• Multiple students can attend the same course at the same time</li>
                  <li>• Trainers cannot teach different courses at overlapping times</li>
                  <li>• Available hours: 9:00 AM to 9:00 PM daily</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-course">
                          <SelectValue placeholder="Select a course" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses?.map((course) => (
                          <SelectItem key={course.id} value={course.id}>
                            {course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-student">
                          <SelectValue placeholder="Select a student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students?.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.firstName} {student.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="trainerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trainer *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-trainer">
                          <SelectValue placeholder="Select a trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainers?.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.firstName} {trainer.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weekStart"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Week Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-week-start" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="daysOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Days of Week (Select 1-3 days)</FormLabel>
                    <div className="grid grid-cols-7 gap-2">
                      {dayNames.map((day, index) => {
                        const dayValue = index; // Sunday = 0, Saturday = 6
                        return (
                          <div key={dayValue} className="flex items-center space-x-2">
                            <Checkbox
                              id={`day-${dayValue}`}
                              checked={field.value?.includes(dayValue)}
                              onCheckedChange={(checked) => {
                                const currentDays = field.value || [];
                                if (checked) {
                                  if (currentDays.length < 3) {
                                    field.onChange([...currentDays, dayValue].sort());
                                  }
                                } else {
                                  field.onChange(currentDays.filter(d => d !== dayValue));
                                }
                              }}
                            />
                            <Label htmlFor={`day-${dayValue}`} className="text-sm">
                              {day.slice(0, 3)}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Selected: {field.value?.length || 0}/3 days
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeSlot"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Slot (2-hour duration)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-time-slot">
                          <SelectValue placeholder="Select a time slot" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60">
                        {timeSlots.map((slot) => (
                          <SelectItem key={slot.value} value={slot.value}>
                            {slot.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Available from 9:00 AM to 9:00 PM (20-minute intervals, 2-hour classes)
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={createScheduleMutation.isPending}
                data-testid="button-create-schedule"
              >
                <Clock className="h-4 w-4 mr-2" />
                {createScheduleMutation.isPending ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Schedule" : "Create Schedule")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
