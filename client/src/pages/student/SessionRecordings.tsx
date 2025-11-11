import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Play, Download, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PageLayout } from "@/components/PageLayout";

interface SharedRecording {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  fileName: string;
  fileSize: number;
  duration?: number;
  uploadedAt: string;
  sharedAt: string;
  trainerName: string;
  courseTitle: string;
}

export default function StudentSessionRecordings() {
  const { data: recordings, isLoading } = useQuery<SharedRecording[]>({
    queryKey: ["/api/student/session-recordings"],
  });

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

  const downloadRecording = (videoUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = videoUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const playRecording = (videoUrl: string) => {
    window.open(videoUrl, '_blank');
  };

  if (isLoading) {
    return (
      <PageLayout title="Session Recordings" subtitle="View recordings shared by your trainers">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
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
    <PageLayout title="Session Recordings" subtitle="View recordings shared by your trainers">
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Video className="h-5 w-5" />
            </div>
            Shared Recordings ({recordings?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {!recordings || recordings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                <Video className="h-10 w-10 text-green-600" />
              </div>
              <p className="text-green-700 font-medium text-lg">No recordings shared yet</p>
              <p className="text-sm text-green-500 mt-1">Your trainers will share session recordings here</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {recordings.map((recording) => (
                <div
                  key={recording.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex-1 space-y-2">
                    <h3 className="font-bold text-green-900">{recording.title}</h3>
                    <p className="text-sm text-green-600">{recording.description}</p>
                    
                    <div className="flex items-center gap-4 text-xs text-green-500">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {recording.trainerName}
                      </span>
                      <span>📚 {recording.courseTitle}</span>
                      <span>📁 {formatFileSize(recording.fileSize)}</span>
                      <span>⏱️ {formatDuration(recording.duration)}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>📅 Recorded: {new Date(recording.uploadedAt).toLocaleDateString()}</span>
                      <span>📤 Shared: {new Date(recording.sharedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => playRecording(recording.videoUrl)}
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Play
                    </Button>
                    
                    <Button
                      onClick={() => downloadRecording(recording.videoUrl, recording.fileName)}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}