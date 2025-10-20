import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, User, BookOpen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EnrollmentRequest {
  id: string;
  studentId: string;
  courseId: string;
  status: "pending" | "approved" | "rejected";
  message?: string;
  createdAt: string;
  reviewedAt?: string;
  student?: {
    id: string;
    username: string;
    email?: string;
  };
  course?: {
    id: string;
    title: string;
  };
  reviewer?: {
    id: string;
    username: string;
  };
}

export default function EnrollmentRequests() {
  const { toast } = useToast();

  const { data: requests, isLoading } = useQuery<EnrollmentRequest[]>({
    queryKey: ["/api/enrollment-requests"],
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/enrollment-requests/${requestId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to approve request");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Request Approved",
        description: data.message || "Student has been enrolled in the course",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-requests"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to approve request",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (requestId: string) => {
      const res = await fetch(`/api/enrollment-requests/${requestId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "Request rejected by administrator" }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to reject request");
      }
      return await res.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Request Rejected",
        description: data.message || "Enrollment request has been rejected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/enrollment-requests"] });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reject request",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-9 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const processedRequests = requests?.filter(r => r.status !== "pending") || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold" data-testid="text-enrollment-requests-title">
          Enrollment Requests
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and manage student enrollment requests
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === "approved").length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {requests?.filter(r => r.status === "rejected").length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => (
                  <TableRow key={request.id} data-testid={`row-request-${request.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{request.student?.username}</div>
                          {request.student?.email && (
                            <div className="text-xs text-muted-foreground">{request.student.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{request.course?.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {request.message || "No message"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(request.id)}
                          disabled={approveMutation.isPending}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(request.id)}
                          disabled={rejectMutation.isPending}
                          data-testid={`button-reject-${request.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {processedRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Request History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {processedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.student?.username}</div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{request.course?.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={request.status === "approved" ? "default" : "destructive"}
                      >
                        {request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {request.reviewer?.username || "N/A"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {request.reviewedAt 
                          ? new Date(request.reviewedAt).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {requests && requests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No enrollment requests yet</p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Requests will appear here when students request to enroll in courses
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
