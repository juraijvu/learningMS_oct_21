import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Download, Eye, CheckCircle, XCircle, Paperclip } from 'lucide-react';

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
        apiRequest('/api/trainer/projects'),
        apiRequest('/api/trainer/courses'),
        apiRequest('/api/trainer/students'),
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
      await apiRequest('/api/trainer/projects', {
        method: 'POST',
        body: {
          ...newAssignment,
          attachmentUrl,
          attachmentName,
        },
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
      await apiRequest(`/api/trainer/projects/submissions/${selectedSubmission.id}/review`, {
        method: 'PATCH',
        body: reviewData,
      });

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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Project Assignments</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course</Label>
                <Select value={newAssignment.courseId} onValueChange={(value) => setNewAssignment({ ...newAssignment, courseId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
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
                <Label htmlFor="student">Student</Label>
                <Select value={newAssignment.studentId} onValueChange={(value) => setNewAssignment({ ...newAssignment, studentId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select student" />
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

              <Button onClick={handleCreateAssignment} disabled={uploading} className="w-full">
                {uploading ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {assignment.title}
                    {getTypeBadge(assignment.type)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {assignment.courseTitle} • {assignment.studentName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.submission && getStatusBadge(assignment.submission.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{assignment.description}</p>
              
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
                <div className="text-center py-8 text-muted-foreground">
                  <p>No submission yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
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
    </div>
  );
}