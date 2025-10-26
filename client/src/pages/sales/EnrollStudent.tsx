import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PageLayout } from "@/components/PageLayout";

export default function EnrollStudent() {
  const { toast } = useToast();
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");

  const { data: students, isLoading: loadingStudents } = useQuery<any[]>({
    queryKey: ["/api/admin/students"],
  });

  const { data: courses, isLoading: loadingCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
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
      setSelectedCourse("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/students"] });
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

  const handleEnrollStudent = () => {
    if (!selectedStudent || !selectedCourse) {
      toast({
        title: "Validation Error",
        description: "Please select both a student and a course",
        variant: "destructive",
      });
      return;
    }
    enrollStudentMutation.mutate({
      studentId: selectedStudent,
      courseId: selectedCourse,
    });
  };

  if (loadingStudents || loadingCourses) {
    return (
      <PageLayout title="Enroll Student" subtitle="Enroll students in available courses">
        <Card className="max-w-2xl bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Enroll Student" 
      subtitle="Enroll students in available courses"
    >
      <Card className="max-w-2xl bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            Student Enrollment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
            <Label className="text-blue-900 font-bold">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger data-testid="select-student" className="border-blue-300 focus:border-blue-500">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.firstName} {student.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label className="text-blue-900 font-bold">Select Course</Label>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger data-testid="select-course" className="border-blue-300 focus:border-blue-500">
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg" 
            disabled={enrollStudentMutation.isPending || !selectedStudent || !selectedCourse}
            data-testid="button-enroll"
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
        </CardContent>
      </Card>
    </PageLayout>
  );
}
