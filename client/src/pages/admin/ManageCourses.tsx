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
import { PageLayout } from "@/components/PageLayout";

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
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to assign course to trainer");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Course assigned to trainer successfully",
      });
      setSelectedTrainer("");
      setSelectedCourseForTrainer("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-logs"] });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to assign course to trainer";
      const isAlreadyAssigned = message.toLowerCase().includes("already assigned");
      
      toast({
        title: isAlreadyAssigned ? "Already Assigned" : "Error",
        description: message,
        variant: isAlreadyAssigned ? "default" : "destructive",
      });
    },
  });

  const enrollStudentMutation = useMutation({
    mutationFn: async (data: { studentId: string; courseId: string }) => {
      const res = await apiRequest("POST", "/api/admin/enroll-student", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to enroll student");
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Student enrolled in course successfully",
      });
      setSelectedStudent("");
      setSelectedCourseForStudent("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/activity-logs"] });
    },
    onError: (error: any) => {
      const message = error.message || "Failed to enroll student";
      const isAlreadyEnrolled = message.toLowerCase().includes("already enrolled");
      
      toast({
        title: isAlreadyEnrolled ? "Already Enrolled" : "Error",
        description: message,
        variant: isAlreadyEnrolled ? "default" : "destructive",
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
    <PageLayout 
      title="Manage Course Assignments" 
      subtitle="Assign courses to trainers and enroll students in the system"
    >
      <div className="grid md:grid-cols-2 gap-8" data-testid="page-manage-courses">
        {/* Assign Course to Trainer */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">
                Assign Course to Trainer
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="trainer-select" className="text-blue-900 font-semibold">
                  Select Trainer
                </Label>
                <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                  <SelectTrigger 
                    id="trainer-select"
                    data-testid="select-trainer"
                    className="h-12 border-blue-200 focus:border-blue-500 rounded-xl"
                  >
                    <SelectValue placeholder="Choose a trainer" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainers?.map((trainer) => (
                      <SelectItem key={trainer.id} value={trainer.id}>
                        {getUserDisplay(trainer)} ({trainer.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="course-trainer-select" className="text-blue-900 font-semibold">
                  Select Course
                </Label>
                <Select
                  value={selectedCourseForTrainer}
                  onValueChange={setSelectedCourseForTrainer}
                >
                  <SelectTrigger 
                    id="course-trainer-select"
                    data-testid="select-course-for-trainer"
                    className="h-12 border-blue-200 focus:border-blue-500 rounded-xl"
                  >
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
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
                className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-assign-trainer"
              >
                {assignTrainerMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Assigning...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Assign Trainer
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Enroll Student in Course */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold">
                Enroll Student in Course
              </h2>
            </div>
          </div>
          <div className="p-6 space-y-6">

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="student-select" className="text-blue-900 font-semibold">
                  Select Student
                </Label>
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger 
                    id="student-select"
                    data-testid="select-student"
                    className="h-12 border-blue-200 focus:border-blue-500 rounded-xl"
                  >
                    <SelectValue placeholder="Choose a student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {getUserDisplay(student)} ({student.username})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="course-student-select" className="text-blue-900 font-semibold">
                  Select Course
                </Label>
                <Select
                  value={selectedCourseForStudent}
                  onValueChange={setSelectedCourseForStudent}
                >
                  <SelectTrigger 
                    id="course-student-select"
                    data-testid="select-course-for-student"
                    className="h-12 border-blue-200 focus:border-blue-500 rounded-xl"
                  >
                    <SelectValue placeholder="Choose a course" />
                  </SelectTrigger>
                  <SelectContent>
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
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                data-testid="button-enroll-student"
              >
                {enrollStudentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Enrolling...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Enroll Student
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
