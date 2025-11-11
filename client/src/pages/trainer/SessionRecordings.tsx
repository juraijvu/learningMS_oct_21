import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Video, Share, Trash2, Download, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";
import { useState } from "react";

interface SessionRecording {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  uploadedAt: string;
  courseTitle: string;
  studentName: string;
}

interface Student {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function SessionRecordings() {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<SessionRecording | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: recordings, isLoading } = useQuery<SessionRecording[]>({
    queryKey: ["/api/trainer/session-recordings"],
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/trainer/students"],
  });

  const shareRecordingMutation = useMutation({
    mutationFn: async ({ recordingId, studentIds }: { recordingId: string; studentIds: string[] }) => {
      const response = await fetch(`/api/trainer/session-recordings/${recordingId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds }),
      });
      if (!response.ok) throw new Error('Failed to share recording');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/session-recordings"] });
      setShareDialogOpen(false);
      setSelectedStudents([]);
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (recordingId: string) => {
      const response = await fetch(`/api/trainer/session-recordings/${recordingId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete recording');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/session-recordings"] });
    },
  });

  const handleShare = (recording: SessionRecording) => {
    setSelectedRecording(recording);
    setSelectedStudents([]);
    setShareDialogOpen(true);
  };

  const handleShareSubmit = () => {
    if (selectedRecording && selectedStudents.length > 0) {
      shareRecordingMutation.mutate({
        recordingId: selectedRecording.id,
        studentIds: selectedStudents,
      });
    }
  };

  const handleDelete = (recordingId: string) => {
    if (confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      deleteRecordingMutation.mutate(recordingId);
    }
  };

  const downloadRecording = (videoUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <PageLayout title="Session Recordings" subtitle="Manage your recorded training sessions">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-60 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Session Recordings" subtitle="Manage your recorded training sessions">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5" />
            </div>
            My Session Recordings ({recordings?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!recordings || recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Video className="h-10 w-10 text-purple-600" />
              </div>
              <p className="text-purple-700 font-medium text-lg">No recordings yet</p>
              <p className="text-sm text-purple-500 mt-1">Start recording sessions to see them here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-purple-900">{recording.title}</h3>
                    <p className="text-sm text-purple-600">{recording.description}</p>
                    <div className="flex items-center gap-4 text-xs text-purple-500">
                      <span>📁 {formatFileSize(recording.fileSize)}</span>
                      <span>⏱️ {formatDuration(recording.duration)}</span>
                      <span>📅 {new Date(recording.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => downloadRecording(recording.videoUrl, recording.fileName)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleShare(recording)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Share className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      onClick={() => handleDelete(recording.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={deleteRecordingMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Share Recording
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedRecording && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium text-gray-900">{selectedRecording.title}</p>
                <p className="text-sm text-gray-600">{selectedRecording.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <p className="font-medium text-gray-900">Select students to share with:</p>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {students?.map((student) => (
                  <div key={student.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={student.id}
                      checked={selectedStudents.includes(student.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents([...selectedStudents, student.id]);
                        } else {
                          setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                        }
                      }}
                    />
                    <label htmlFor={student.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {student.firstName} {student.lastName} ({student.username})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShareDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleShareSubmit}
                disabled={selectedStudents.length === 0 || shareRecordingMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Share with {selectedStudents.length} student{selectedStudents.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}