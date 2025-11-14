import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Download, Eye, CheckCircle, XCircle, Paperclip, FileText, Users, BookOpen, Calendar, Star, Upload, Clock, AlertTriangle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';

interface ProjectAssignment {
  id: string;
  courseId: string;
  studentId: string;
  type: 'minor1' | 'minor2' | 'final';
  title: string;
  description: string;
  attachmentUrl?: string;
  attachmentName?: string;
  assignedAt: string;
  studentName: string;
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

interface Course {
  id: string;
  title: string;
}

interface Student {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export default function ProjectAssignments() {
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<ProjectAssignment['submission'] | null>(null);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>('');

  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    studentId: '',
    type: 'minor1' as 'minor1' | 'minor2' | 'final',
    title: '',
    description: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [reviewData, setReviewData] = useState({
    status: 'approved' as 'approved' | 'rejected',
    grade: '',
    comment: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [assignmentsRes, coursesRes, studentsRes] = await Promise.all([
        apiRequest('GET', '/api/trainer/projects'),
        apiRequest('GET', '/api/trainer/courses'),
        apiRequest('GET', '/api/trainer/students'),
      ]);

      setAssignments(assignmentsRes);
      setCourses(coursesRes);
      setStudents(studentsRes);
    } catch (error) {
      console.error('Error fetching data:', error);
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

  const handleCreateAssignment = async () => {
    setUploading(true);
    try {
      let attachmentUrl = '';
      let attachmentName = '';

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const uploadResponse = await fetch('/api/trainer/tasks/upload-file', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadResult = await uploadResponse.json();
        attachmentUrl = uploadResult.fileUrl;
        attachmentName = uploadResult.fileName;
      }

      // Create assignment with attachment info
      await apiRequest('POST', '/api/trainer/projects', {
        ...newAssignment,
        attachmentUrl,
        attachmentName,
      });

      setIsCreateDialogOpen(false);
      setNewAssignment({
        courseId: '',
        studentId: '',
        type: 'minor1',
        title: '',
        description: '',
      });
      setSelectedFile(null);
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission) return;

    try {
      await apiRequest('PATCH', `/api/trainer/projects/submissions/${selectedSubmission.id}/review`, reviewData);

      setIsReviewDialogOpen(false);
      setSelectedSubmission(null);
      setReviewData({ status: 'approved', grade: '', comment: '' });
      fetchData();
    } catch (error) {
      console.error('Error reviewing submission:', error);
    }
  };

  const handleDownload = (fileUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = `/api/projects/submissions/download/${selectedSubmission?.id}`;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge variant="secondary">Submitted</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-500">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
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
    <PageLayout title="Project Assignments" subtitle="Create and manage student project assignments">
      <div className="flex justify-end items-center mb-6">
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Assignments</p>
          <p className="text-2xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Assignment Statistics */}
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
          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Pending Review</p>
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
          <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium text-red-900">Needs Work</p>
                  <p className="text-xl font-bold text-red-900">
                    {assignments.filter(a => a.submission?.status === 'rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              <Plus className="h-5 w-5 mr-2" />
              Create New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Project Assignment</DialogTitle>
              <p className="text-muted-foreground">Set up a new project for your students</p>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="course" className="text-base font-semibold">Course</Label>
                  <Select value={newAssignment.courseId} onValueChange={(value) => setNewAssignment({ ...newAssignment, courseId: value })}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select course" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="student" className="text-base font-semibold">Student</Label>
                  <Select value={newAssignment.studentId} onValueChange={(value) => setNewAssignment({ ...newAssignment, studentId: value })}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="Select student" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.firstName && student.lastName 
                            ? `${student.firstName} ${student.lastName}` 
                            : student.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="type">Project Type</Label>
                <Select value={newAssignment.type} onValueChange={(value: 'minor1' | 'minor2' | 'final') => setNewAssignment({ ...newAssignment, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor1">Minor Project 1</SelectItem>
                    <SelectItem value="minor2">Minor Project 2</SelectItem>
                    <SelectItem value="final">Final Project</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Project title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Project description and requirements"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="attachment">Attachment (Optional)</Label>
                <Input
                  id="attachment"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,.tar,.gz,.jpg,.jpeg,.png,.gif,.webp,.bmp,.tiff,.json,.xml,.dwg,.step,.stp,.iges,.igs,.stl,.obj,.fbx,.3ds,.blend,.max,.c,.cpp,.h,.hpp,.py,.js,.ts,.html,.css,.java,.cs,.php,.rb,.go,.rs,.swift,.kt,.scala,.m,.mm,.r,.sql,.sh,.bat,.ps1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Upload project requirements, UI mockups, plans, or reference materials
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
                onClick={handleCreateAssignment} 
                disabled={uploading || !newAssignment.courseId || !newAssignment.studentId || !newAssignment.title || !newAssignment.description} 
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
                size="lg"
              >
                {uploading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating Assignment...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Create Assignment
                  </div>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-xl">{assignment.title}</CardTitle>
                    {getTypeBadge(assignment.type)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{assignment.courseTitle}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{assignment.studentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>Assigned {new Date(assignment.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.submission ? getStatusBadge(assignment.submission.status) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <Clock className="h-3 w-3 mr-1" />
                      Awaiting Submission
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Project Description
                </h4>
                <p className="text-sm leading-relaxed">{assignment.description}</p>
              </div>
              
              {assignment.attachmentUrl && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
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
                      {assignment.submission.grade && (
                        <p className="text-sm font-medium">Grade: {assignment.submission.grade}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(assignment.submission!.fileUrl, assignment.submission!.fileName)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {assignment.submission.status === 'submitted' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedSubmission(assignment.submission!);
                            setSelectedAssignmentId(assignment.id);
                            setIsReviewDialogOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {assignment.submission.trainerComment && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium mb-1">Trainer Comment:</p>
                      <p className="text-sm">{assignment.submission.trainerComment}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Separator className="mb-6" />
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border border-orange-200">
                    <div className="flex flex-col items-center gap-3">
                      <div className="p-3 bg-orange-100 rounded-full">
                        <AlertTriangle className="h-8 w-8 text-orange-600" />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-orange-900 mb-1">Awaiting Submission</h3>
                        <p className="text-sm text-orange-700">Student hasn't submitted their project yet</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  <h3 className="font-semibold text-lg mb-2">No Project Assignments</h3>
                  <p className="text-muted-foreground mb-4">Create your first project assignment to get started.</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Assignment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Project Submission</DialogTitle>
          </DialogHeader>
          {selectedSubmission && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedSubmission.fileName}</p>
                <p className="text-sm text-muted-foreground">
                  Submitted: {new Date(selectedSubmission.submittedAt).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <Label>Decision</Label>
                <Select value={reviewData.status} onValueChange={(value: 'approved' | 'rejected') => setReviewData({ ...reviewData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="approved">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Approve
                      </div>
                    </SelectItem>
                    <SelectItem value="rejected">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Reject
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {reviewData.status === 'approved' && (
                <div>
                  <Label htmlFor="grade">Grade (Optional)</Label>
                  <Input
                    id="grade"
                    value={reviewData.grade}
                    onChange={(e) => setReviewData({ ...reviewData, grade: e.target.value })}
                    placeholder="e.g., A+, 95%, Excellent"
                  />
                </div>
              )}
              
              <div>
                <Label htmlFor="comment">Comment (Optional)</Label>
                <Textarea
                  id="comment"
                  value={reviewData.comment}
                  onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                  placeholder="Feedback for the student"
                  rows={3}
                />
              </div>
              
              <Button onClick={handleReviewSubmission} className="w-full">
                Submit Review
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}