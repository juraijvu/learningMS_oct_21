import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Search, UserCheck, BookOpen } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface TrainerAssignment {
  id: string;
  trainerId: string;
  courseId: string;
  assignedAt: string;
  trainer: {
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

export default function TrainerAssignments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; assignmentId: string; trainerName: string; courseTitle: string }>({
    open: false,
    assignmentId: "",
    trainerName: "",
    courseTitle: ""
  });

  const { data: assignments, isLoading } = useQuery<TrainerAssignment[]>({
    queryKey: ["/api/admin/trainer-assignments"],
  });

  const deleteAssignmentMutation = useMutation({
    mutationFn: async (assignmentId: string) => {
      return await apiRequest("DELETE", `/api/admin/trainer-assignments/${assignmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/trainer-assignments"] });
      toast({
        title: "Success",
        description: "Trainer assignment removed successfully",
      });
      setDeleteDialog({ open: false, assignmentId: "", trainerName: "", courseTitle: "" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAssignments = assignments?.filter(assignment => 
    assignment.trainer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.trainer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.trainer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <PageLayout title="Trainer Assignments" subtitle="Manage trainer course assignments">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading assignments...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Trainer Assignments" subtitle="Manage trainer course assignments">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              All Trainer Assignments ({filteredAssignments.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search trainers or courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No assignments found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div>
                        <p className="font-medium">
                          {assignment.trainer.firstName && assignment.trainer.lastName
                            ? `${assignment.trainer.firstName} ${assignment.trainer.lastName}`
                            : assignment.trainer.username}
                        </p>
                        <p className="text-sm text-muted-foreground">{assignment.trainer.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{assignment.course.title}</span>
                      <Badge variant="outline">{assignment.course.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteDialog({
                      open: true,
                      assignmentId: assignment.id,
                      trainerName: assignment.trainer.firstName && assignment.trainer.lastName
                        ? `${assignment.trainer.firstName} ${assignment.trainer.lastName}`
                        : assignment.trainer.username,
                      courseTitle: assignment.course.title
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
        onOpenChange={(open) => !open && setDeleteDialog({ open: false, assignmentId: "", trainerName: "", courseTitle: "" })}
        onConfirm={() => deleteAssignmentMutation.mutate(deleteDialog.assignmentId)}
        title="Remove Trainer Assignment"
        description={`Are you sure you want to remove ${deleteDialog.trainerName} from "${deleteDialog.courseTitle}"? This action cannot be undone.`}
        confirmText="Remove Assignment"
        variant="destructive"
      />
    </PageLayout>
  );
}