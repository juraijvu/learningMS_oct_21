import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { Upload, Download, Clock, CheckCircle, XCircle, AlertCircle, FileText, Calendar, User, BookOpen, Star } from 'lucide-react';

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Projects</h1>
          <p className="text-muted-foreground">Track and submit your project assignments</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Projects</p>
          <p className="text-2xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Project Statistics */}
      {assignments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Total</p>
                  <p className="text-xl font-bold text-blue-900">{assignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">Pending</p>
                  <p className="text-xl font-bold text-yellow-900">
                    {assignments.filter(a => !a.submission).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Under Review</p>
                  <p className="text-xl font-bold text-orange-900">
                    {assignments.filter(a => a.submission?.status === 'submitted').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-900">Approved</p>
                  <p className="text-xl font-bold text-green-900">
                    {assignments.filter(a => a.submission?.status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(assignment.submission?.status)}
                    <CardTitle className="text-xl">{assignment.title}</CardTitle>
                    {getTypeBadge(assignment.type)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{assignment.courseTitle}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>Assigned by {assignment.trainerName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(assignment.submission?.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Project Description
                  </h4>
                  <p className="text-sm leading-relaxed">{assignment.description}</p>
                </div>

                {assignment.attachmentUrl && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Download className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Assignment Materials</p>
                          <p className="text-sm text-blue-700">{assignment.attachmentName}</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = assignment.attachmentUrl!;
                          link.download = assignment.attachmentName || 'attachment';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                )}

                {assignment.submission ? (
                  <div className="space-y-4">
                    <Separator />
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Upload className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-900">Your Submission</p>
                            <p className="text-sm text-green-700">{assignment.submission.fileName}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-green-300 text-green-700 hover:bg-green-100"
                          onClick={() => handleDownload(assignment.submission!.id, assignment.submission!.fileName)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-green-600 font-medium">Submitted</p>
                          <p className="text-green-800">{new Date(assignment.submission.submittedAt).toLocaleDateString()}</p>
                        </div>
                        {assignment.submission.reviewedAt && (
                          <div>
                            <p className="text-green-600 font-medium">Reviewed</p>
                            <p className="text-green-800">{new Date(assignment.submission.reviewedAt).toLocaleDateString()}</p>
                          </div>
                        )}
                        {assignment.submission.grade && (
                          <div>
                            <p className="text-green-600 font-medium flex items-center gap-1">
                              <Star className="h-4 w-4" />
                              Grade
                            </p>
                            <p className="text-green-800 font-semibold">{assignment.submission.grade}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {assignment.submission.trainerComment && (
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg mt-1">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-blue-900 mb-2">Trainer Feedback</p>
                            <p className="text-sm text-blue-800 leading-relaxed">{assignment.submission.trainerComment}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {assignment.submission.status === 'rejected' && (
                      <Button
                        onClick={() => {
                          setSelectedAssignment(assignment);
                          setIsSubmitDialogOpen(true);
                        }}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                        size="lg"
                      >
                        <Upload className="h-5 w-5 mr-2" />
                        Resubmit Project
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Separator className="mb-6" />
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full">
                          <Upload className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-blue-900 mb-1">Ready to Submit?</h3>
                          <p className="text-sm text-blue-700 mb-4">Upload your completed project file</p>
                        </div>
                        <Button
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setIsSubmitDialogOpen(true);
                          }}
                          size="lg"
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                        >
                          <Upload className="h-5 w-5 mr-2" />
                          Submit Project
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {assignments.length === 0 && (
          <Card className="border-dashed border-2">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">No Projects Yet</h3>
                  <p className="text-muted-foreground">Your project assignments will appear here once they're created by your trainers.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Submit Dialog */}
      <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedAssignment?.submission?.status === 'rejected' ? 'Resubmit' : 'Submit'} Project
            </DialogTitle>
          </DialogHeader>
          {selectedAssignment && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-blue-900">{selectedAssignment.title}</p>
                    <p className="text-sm text-blue-700">{selectedAssignment.courseTitle}</p>
                  </div>
                  {getTypeBadge(selectedAssignment.type)}
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="file" className="text-base font-semibold">Select Project File</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-blue-300 transition-colors">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.json,.xml,.dwg,.step,.stp,.iges,.igs,.stl,.obj,.fbx,.3ds,.blend,.max,.c,.cpp,.h,.hpp,.py,.js,.ts,.html,.css,.java,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.m,.mm,.r,.sql,.sh,.bat,.ps1"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <p className="font-medium">Click to select your project file</p>
                    <p className="text-sm text-muted-foreground">
                      Supports: Documents, Images, Archives, Engineering files, Code files, and more
                    </p>
                  </div>
                </div>
              </div>

              {selectedFile && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-green-900">File Selected</p>
                      <p className="text-sm text-green-700">{selectedFile.name}</p>
                      <p className="text-xs text-green-600">
                        Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <Button
                onClick={handleSubmitProject}
                disabled={!selectedFile || uploading}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                size="lg"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Uploading...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Submit Project
                  </div>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}