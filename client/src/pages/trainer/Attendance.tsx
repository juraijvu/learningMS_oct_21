import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface Attendance {
  id: string;
  courseTitle: string;
  studentName: string;
  date: string;
  status: 'present' | 'absent' | 'late';
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export default function TrainerAttendance() {
  const { toast } = useToast();
  const [selectedAttendance, setSelectedAttendance] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const { data: attendance, isLoading } = useQuery<Attendance[]>({
    queryKey: ['/api/trainer/attendance'],
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) =>
      apiRequest(`/api/trainer/attendance/${id}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ notes }),
        headers: { 'Content-Type': 'application/json' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trainer/attendance'] });
      toast({
        title: "Attendance Verified!",
        description: "Student attendance has been verified.",
      });
      setSelectedAttendance(null);
      setNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to verify attendance.",
        variant: "destructive",
      });
    },
  });

  const unverifiedAttendance = attendance?.filter(a => !a.verifiedAt) || [];
  const verifiedAttendance = attendance?.filter(a => a.verifiedAt) || [];

  if (isLoading) {
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
        <h1 className="text-3xl font-semibold">Student Attendance</h1>
        <p className="text-muted-foreground mt-1">Verify and manage student attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Pending Verification
          </CardTitle>
          <CardDescription>Attendance records waiting for your verification</CardDescription>
        </CardHeader>
        <CardContent>
          {unverifiedAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">All attendance records are verified</p>
            </div>
          ) : (
            <div className="space-y-2">
              {unverifiedAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded border"
                  data-testid={`attendance-pending-${record.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.courseTitle} • {new Date(record.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                      {record.status}
                    </Badge>
                    <Dialog open={selectedAttendance === record.id} onOpenChange={(open) => {
                      if (!open) {
                        setSelectedAttendance(null);
                        setNotes("");
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          onClick={() => setSelectedAttendance(record.id)}
                          data-testid={`button-verify-${record.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Verify Attendance</DialogTitle>
                          <DialogDescription>
                            Verify {record.studentName}'s attendance for {record.courseTitle}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Date:</p>
                            <p className="font-medium">{new Date(record.date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status:</p>
                            <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                              {record.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <Label>Notes (Optional)</Label>
                            <Textarea
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Add any notes about this attendance..."
                              data-testid="input-notes"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => verifyMutation.mutate({ id: record.id, notes })}
                            disabled={verifyMutation.isPending}
                            data-testid="button-confirm-verify"
                          >
                            {verifyMutation.isPending ? "Verifying..." : "Verify"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Verified Attendance
          </CardTitle>
          <CardDescription>Previously verified attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {verifiedAttendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No verified records yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {verifiedAttendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded border"
                  data-testid={`attendance-verified-${record.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium">{record.studentName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.courseTitle} • {new Date(record.date).toLocaleDateString()}
                      </p>
                      {record.notes && (
                        <p className="text-xs text-muted-foreground mt-1">Note: {record.notes}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={record.status === 'present' ? 'default' : record.status === 'late' ? 'secondary' : 'destructive'}>
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
