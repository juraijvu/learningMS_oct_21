import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, Users, BookOpen } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface StudentEnrollment {
  id: string;
  studentId: string;
  courseId: string;
  enrolledAt: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    email: string;
  };
  course: {
    id: string;
    title: string;
    category: string;
  };
}

export default function StudentEnrollments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; enrollmentId: string; studentName: string; courseTitle: string }>({
    open: false,
    enrollmentId: "",
    studentName: "",
    courseTitle: ""
  });

  const { data: enrollments, isLoading } = useQuery<StudentEnrollment[]>({
    queryKey: ["/api/admin/student-enrollments"],
  });

  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      return await apiRequest("DELETE", `/api/admin/enrollments/${enrollmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/student-enrollments"] });
      toast({
        title: "Success",
        description: "Student enrollment removed successfully",
      });
      setDeleteDialog({ open: false, enrollmentId: "", studentName: "", courseTitle: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredEnrollments = enrollments?.filter(enrollment => 
    enrollment.student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    enrollment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <PageLayout title="Student Enrollments" subtitle="Manage student course enrollments">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading enrollments...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Student Enrollments" subtitle="Manage student course enrollments">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              All Student Enrollments ({filteredEnrollments.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredEnrollments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No enrollments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEnrollments.map((enrollment) => (
                <div
                  key={enrollment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-medium">
                          {enrollment.student.firstName && enrollment.student.lastName
                            ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                            : enrollment.student.username}
                        </p>
                        <p className="text-sm text-muted-foreground">{enrollment.student.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{enrollment.course.title}</span>
                      <Badge variant="outline">{enrollment.course.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialog({
                      open: true,
                      enrollmentId: enrollment.id,
                      studentName: enrollment.student.firstName && enrollment.student.lastName
                        ? `${enrollment.student.firstName} ${enrollment.student.lastName}`
                        : enrollment.student.username,
                      courseTitle: enrollment.course.title
                    })}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, enrollmentId: "", studentName: "", courseTitle: "" })}
        onConfirm={() => deleteEnrollmentMutation.mutate(deleteDialog.enrollmentId)}
        title="Remove Student Enrollment"
        description={`Are you sure you want to remove ${deleteDialog.studentName} from "${deleteDialog.courseTitle}"? This action cannot be undone.`}
        confirmText="Remove Enrollment"
        variant="destructive"
      />
    </PageLayout>
  );
}