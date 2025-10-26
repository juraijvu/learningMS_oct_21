import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UserAvatar } from "@/components/UserAvatar";
import { PageLayout } from "@/components/PageLayout";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function TrainerStudents() {
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/trainer/students"],
  });

  if (isLoading) {
    return (
      <PageLayout title="My Students" subtitle="View and manage students enrolled in your courses">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <Skeleton className="h-6 w-32 bg-white/20" />
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
      title="My Students" 
      subtitle="View and manage students enrolled in your courses"
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            Student List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-3">
            {students && students.length > 0 ? (
              students.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md"
                  data-testid={`student-${student.id}`}
                >
                  <UserAvatar user={student as any} className="h-12 w-12 border-2 border-blue-300" />
                  <div className="flex-1">
                    <p className="font-bold text-blue-900">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-blue-600">{student.email}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <GraduationCap className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-blue-700 font-medium text-lg">No students assigned to your courses yet</p>
                <p className="text-sm text-blue-500 mt-2">Students will appear here once they are enrolled in your courses</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  );
}
