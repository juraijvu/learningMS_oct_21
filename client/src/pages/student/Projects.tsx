import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ProjectAssignment {
  id: string;
  courseId: string;
  type: 'minor1' | 'minor2' | 'final';
  title: string;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  assignedAt: string;
  trainerName: string;
  courseTitle: string;
  submission?: {
    id: string;
    status: 'submitted' | 'approved' | 'rejected';
    grade?: string;
    trainerComment?: string;
    fileUrl: string;
    fileName: string;
    submittedAt: string;
    reviewedAt?: string;
  };
}

export default function Projects() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<ProjectAssignment | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    try {
      const response = await apiRequest('/api/student/projects');
      setAssignments(response);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmitProject = async () => {
    if (!selectedAssignment || !selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch(`/api/student/projects/${selectedAssignment.id}/submit`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to submit project');
      }

      setIsSubmitDialogOpen(false);
      setSelectedAssignment(null);
      setSelectedFile(null);
      fetchAssignments();
    } catch (error) {
      console.error('Error submitting project:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (submissionId: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/projects/submissions/download/${submissionId}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary">Under Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Needs Revision</Badge>;
      default:
        return <Badge variant="outline">Not Submitted</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'minor1':
        return <Badge variant="outline">Minor Project 1</Badge>;
      case 'minor2':
        return <Badge variant="outline">Minor Project 2</Badge>;
      case 'final':
        return <Badge variant="default" className="bg-blue-500">Final Project</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Projects</h1>
      </div>

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(assignment.submission?.status)}
                    {assignment.title}
                    {getTypeBadge(assignment.type)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.courseTitle} • Assigned by {assignment.trainerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(assignment.submission?.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Description:</h4>
                  <p className="text-sm text-muted-foreground">{assignment.description}</p>
                </div>

                {assignment.attachmentUrl && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Assignment Materials:</p>
                        <p className="text-sm text-muted-foreground">{assignment.attachmentName}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = assignment.attachmentUrl!;
                          link.download = assignment.attachmentName || 'attachment';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {assignment.submission ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{assignment.submission.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(assignment.submission.submittedAt).toLocaleDateString()}
                        </p>
                        {assignment.submission.reviewedAt && (
                          <p className="text-sm text-muted-foreground">
                            Reviewed: {new Date(assignment.submission.reviewedAt).toLocaleDateString()}
                          </p>
                        )}
                        {assignment.submission.grade && (
                          <p className="text-sm font-medium text-green-600">
                            Grade: {assignment.submission.grade}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(assignment.submission!.id, assignment.submission!.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>

                    {assignment.submission.trainerComment && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm font-medium mb-1">Trainer Feedback:</p>
                        <p className="text-sm">{assignment.submission.trainerComment}</p>
                      </div>
                    )}

                    {assignment.submission.status === 'rejected' && (
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitDialogOpen(true);
                        }}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Resubmit Project
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setIsSubmitDialogOpen(true);
                      }}
                      size="lg"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Project
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No project assignments yet.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedAssignment?.submission?.status === 'rejected' ? 'Resubmit' : 'Submit'} Project
            </DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedAssignment.title}</p>
                <p className="text-sm text-muted-foreground">{selectedAssignment.courseTitle}</p>
                {getTypeBadge(selectedAssignment.type)}
              </div>

              <div>
                <Label htmlFor="file">Select Project File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.json,.xml,.dwg,.step,.stp,.iges,.igs,.stl,.obj,.fbx,.3ds,.blend,.max,.c,.cpp,.h,.hpp,.py,.js,.ts,.html,.css,.java,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.m,.mm,.r,.sql,.sh,.bat,.ps1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Supported: Documents, Images, Archives, Engineering files (CAD, 3D models), Code files, and more
                </p>
              </div>

              {selectedFile && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm font-medium">Selected file:</p>
                  <p className="text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              )}

              <Button
                onClick={handleSubmitProject}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Submit Project'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}