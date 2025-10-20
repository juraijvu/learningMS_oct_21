import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { UserPlus, BookOpen, Users, GraduationCap } from "lucide-react";

type User = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role: string;
};

type Course = {
  id: string;
  title: string;
  description: string;
};

export default function ManageCourses() {
  const { toast } = useToast();
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourseForTrainer, setSelectedCourseForTrainer] = useState<string>("");
  const [selectedCourseForStudent, setSelectedCourseForStudent] = useState<string>("");

  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  const { data: trainers } = useQuery<User[]>({
    queryKey: ["/api/admin/trainers"],
  });

  const { data: students } = useQuery<User[]>({
    queryKey: ["/api/admin/students"],
  });

  const assignTrainerMutation = useMutation({
    mutationFn: async (data: { trainerId: string; courseId: string }) => {
      const res = await apiRequest("POST", "/api/admin/assign-course-to-trainer", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course assigned to trainer successfully",
      });
      setSelectedTrainer("");
      setSelectedCourseForTrainer("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign course to trainer",
        variant: "destructive",
      });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (data: { studentId: string; courseId: string }) => {
      const res = await apiRequest("POST", "/api/admin/enroll-student", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student enrolled in course successfully",
      });
      setSelectedStudent("");
      setSelectedCourseForStudent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-logs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      });
    },
  });

  const handleAssignTrainer = () => {
    if (!selectedTrainer || !selectedCourseForTrainer) {
      toast({
        title: "Error",
        description: "Please select both a trainer and a course",
        variant: "destructive",
      });
      return;
    }
    assignTrainerMutation.mutate({
      trainerId: selectedTrainer,
      courseId: selectedCourseForTrainer,
    });
  };

  const handleEnrollStudent = () => {
    if (!selectedStudent || !selectedCourseForStudent) {
      toast({
        title: "Error",
        description: "Please select both a student and a course",
        variant: "destructive",
      });
      return;
    }
    enrollStudentMutation.mutate({
      studentId: selectedStudent,
      courseId: selectedCourseForStudent,
    });
  };

  const getUserDisplay = (user: User) => {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
    return fullName || user.username;
  };

  return (
    <div className="container mx-auto p-6 space-y-6" data-testid="page-manage-courses">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100" data-testid="heading-manage-courses">
            Manage Course Assignments
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Assign courses to trainers and enroll students
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Assign Course to Trainer */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Assign Course to Trainer
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trainer-select" className="text-gray-900 dark:text-gray-100">
                  Select Trainer
                </Label>
                <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                  <SelectTrigger 
                    id="trainer-select"
                    data-testid="select-trainer"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <SelectValue placeholder="Choose a trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {trainers?.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {getUserDisplay(trainer)} ({trainer.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-trainer-select" className="text-gray-900 dark:text-gray-100">
                  Select Course
                </Label>
                <Select
                  value={selectedCourseForTrainer}
                  onValueChange={setSelectedCourseForTrainer}
                >
                  <SelectTrigger 
                    id="course-trainer-select"
                    data-testid="select-course-for-trainer"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleAssignTrainer}
                disabled={assignTrainerMutation.isPending || !selectedTrainer || !selectedCourseForTrainer}
                className="w-full bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600"
                data-testid="button-assign-trainer"
              >
                {assignTrainerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Trainer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Enroll Student in Course */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Enroll Student in Course
              </h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student-select" className="text-gray-900 dark:text-gray-100">
                  Select Student
                </Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger 
                    id="student-select"
                    data-testid="select-student"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {getUserDisplay(student)} ({student.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="course-student-select" className="text-gray-900 dark:text-gray-100">
                  Select Course
                </Label>
                <Select
                  value={selectedCourseForStudent}
                  onValueChange={setSelectedCourseForStudent}
                >
                  <SelectTrigger 
                    id="course-student-select"
                    data-testid="select-course-for-student"
                    className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                  >
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleEnrollStudent}
                disabled={enrollStudentMutation.isPending || !selectedStudent || !selectedCourseForStudent}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
                data-testid="button-enroll-student"
              >
                {enrollStudentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Enroll Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
