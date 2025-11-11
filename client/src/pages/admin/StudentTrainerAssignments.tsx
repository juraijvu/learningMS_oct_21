import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { Plus, Trash2, Users, BookOpen, UserCheck, Calendar } from 'lucide-react';

interface StudentTrainerAssignment {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  trainerId: string;
  trainerName: string;
  courseId: string;
  courseTitle: string;
  assignedAt: string;
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
  email: string;
}

interface Trainer {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export default function StudentTrainerAssignments() {
  const [assignments, setAssignments] = useState<StudentTrainerAssignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const [newAssignment, setNewAssignment] = useState({
    courseId: '',
    studentId: '',
    trainerId: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [assignmentsRes, coursesRes] = await Promise.all([
        apiRequest('/api/admin/student-trainer-assignments'),
        apiRequest('/api/admin/courses'),
      ]);

      console.log('Assignments:', assignmentsRes);
      console.log('Courses:', coursesRes);
      console.log('Courses length:', coursesRes?.length);
      console.log('Courses array:', Array.isArray(coursesRes));
      setAssignments(assignmentsRes || []);
      setCourses(coursesRes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndTrainers = async (courseId: string) => {
    try {
      const [studentsRes, trainersRes] = await Promise.all([
        apiRequest(`/api/admin/unassigned-students/${courseId}`),
        apiRequest(`/api/admin/course-trainers/${courseId}`),
      ]);

      setStudents(studentsRes);
      setTrainers(trainersRes);
    } catch (error) {
      console.error('Error fetching students and trainers:', error);
    }
  };

  const handleCourseChange = (courseId: string) => {
    setNewAssignment({ ...newAssignment, courseId, studentId: '', trainerId: '' });
    if (courseId) {
      fetchStudentsAndTrainers(courseId);
    }
  };

  const handleCreateAssignment = async () => {
    try {
      await apiRequest('/api/admin/student-trainer-assignments', {
        method: 'POST',
        body: newAssignment,
      });

      setIsCreateDialogOpen(false);
      setNewAssignment({ courseId: '', studentId: '', trainerId: '' });
      setStudents([]);
      setTrainers([]);
      fetchData();
    } catch (error) {
      console.error('Error creating assignment:', error);
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;

    try {
      await apiRequest(`/api/admin/student-trainer-assignments/${id}`, {
        method: 'DELETE',
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  // Group assignments by course
  const assignmentsByCourse = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.courseId]) {
      acc[assignment.courseId] = {
        courseTitle: assignment.courseTitle,
        assignments: [],
      };
    }
    acc[assignment.courseId].assignments.push(assignment);
    return acc;
  }, {} as Record<string, { courseTitle: string; assignments: StudentTrainerAssignment[] }>);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student-Trainer Assignments</h1>
          <p className="text-muted-foreground">Assign students to specific trainers for each course</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Assignments</p>
          <p className="text-2xl font-bold">{assignments.length}</p>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Assignments</p>
                <p className="text-xl font-bold text-blue-900">{assignments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Active Courses</p>
                <p className="text-xl font-bold text-green-900">{Object.keys(assignmentsByCourse).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-900">Unique Students</p>
                <p className="text-xl font-bold text-purple-900">
                  {new Set(assignments.map(a => a.studentId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              <Plus className="h-5 w-5 mr-2" />
              Assign Student to Trainer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl">Create Assignment</DialogTitle>
              <p className="text-muted-foreground">Assign a student to a trainer for a specific course</p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course" className="text-base font-semibold">Course</Label>
                <p className="text-xs text-gray-500 mb-1">Available courses: {courses.length}</p>
                <Select value={newAssignment.courseId} onValueChange={handleCourseChange}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select course" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length === 0 ? (
                      <SelectItem value="no-courses" disabled>
                        No courses available
                      </SelectItem>
                    ) : (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {newAssignment.courseId && (
                <>
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
                    {students.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        No unassigned students found for this course
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="trainer" className="text-base font-semibold">Trainer</Label>
                    <Select value={newAssignment.trainerId} onValueChange={(value) => setNewAssignment({ ...newAssignment, trainerId: value })}>
                      <SelectTrigger className="h-11">
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-muted-foreground" />
                          <SelectValue placeholder="Select trainer" />
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {trainers.map((trainer) => (
                          <SelectItem key={trainer.id} value={trainer.id}>
                            {trainer.firstName && trainer.lastName 
                              ? `${trainer.firstName} ${trainer.lastName}` 
                              : trainer.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {trainers.length === 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        No trainers assigned to this course
                      </p>
                    )}
                  </div>
                </>
              )}

              <Button 
                onClick={handleCreateAssignment} 
                disabled={!newAssignment.courseId || !newAssignment.studentId || !newAssignment.trainerId}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600" 
                size="lg"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Create Assignment
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {Object.keys(assignmentsByCourse).length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="text-center py-16">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  <UserCheck className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">No Assignments Yet</h3>
                  <p className="text-muted-foreground mb-4">Start by assigning students to trainers for specific courses.</p>
                  <Button 
                    onClick={() => setIsCreateDialogOpen(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Assignment
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(assignmentsByCourse).map(([courseId, { courseTitle, assignments: courseAssignments }]) => (
            <Card key={courseId} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{courseTitle}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    {courseAssignments.length} Students
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-3">
                  {courseAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{assignment.studentName}</span>
                        </div>
                        <div className="text-muted-foreground">→</div>
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-600" />
                          <span className="font-medium">{assignment.trainerName}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(assignment.assignedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAssignment(assignment.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}