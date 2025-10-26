import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ClipboardList, CheckCircle, Clock, Plus, Download, ThumbsUp, ThumbsDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLayout } from "@/components/PageLayout";
import type { User, Module } from "@shared/schema";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  studentId: string;
  studentName?: string;
  fileUrl?: string;
}

export default function TrainerTasks() {
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  const [taskForm, setTaskForm] = useState({
    courseId: "",
    moduleId: "",
    title: "",
    description: "",
  });

  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/trainer/tasks"],
  });

  // Fetch students for assignment
  const { data: students } = useQuery<User[]>({
    queryKey: ["/api/trainer/students"],
  });

  // Fetch trainer's courses
  const { data: courses } = useQuery({
    queryKey: ["/api/trainer/courses"],
  });

  // Fetch modules for selected course
  const { data: modules, isLoading: modulesLoading, error: modulesError } = useQuery<Module[]>({
    queryKey: ["/api/courses", taskForm.courseId, "modules"],
    queryFn: async () => {
      if (!taskForm.courseId) {
        throw new Error('No course ID provided');
      }
      
      const response = await apiRequest("GET", `/api/courses/${taskForm.courseId}/modules`);
      const result = await response.json();
      console.log('Modules loaded:', result);
      return result;
    },
    enabled: !!taskForm.courseId,
  });



  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (taskData: any) => {
      const tasks = await Promise.all(
        selectedStudents.map(async studentId => {
          const response = await apiRequest("POST", "/api/trainer/tasks", {
            ...taskData,
            studentId,
          });
          return response.json();
        })
      );
      return tasks;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/tasks"] });
      toast({
        title: "Success",
        description: `Task assigned to ${selectedStudents.length} student(s) successfully`,
      });
      setCreateDialogOpen(false);
      setTaskForm({ courseId: "", moduleId: "", title: "", description: "" });
      setSelectedStudents([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve task mutation
  const approveTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("PATCH", `/api/trainer/tasks/${taskId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/tasks"] });
      toast({
        title: "Success",
        description: "Task approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject task mutation
  const rejectTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("PATCH", `/api/trainer/tasks/${taskId}/reject`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/tasks"] });
      toast({
        title: "Success",
        description: "Task rejected - student can resubmit",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateTask = () => {
    if (!taskForm.courseId || !taskForm.moduleId || !taskForm.title || selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select at least one student",
        variant: "destructive",
      });
      return;
    }

    createTaskMutation.mutate(taskForm);
  };

  if (isLoading) {
    return (
      <PageLayout title="Tasks" subtitle="Create and review student task submissions">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <Skeleton className="h-6 w-48 bg-white/20" />
          </CardHeader>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Tasks" 
      subtitle="Create and review student task submissions"
      action={
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select
                  value={taskForm.courseId}
                  onValueChange={(value) => setTaskForm({ ...taskForm, courseId: value, moduleId: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses && courses.length > 0 ? (
                      courses.map((course: any) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        No courses available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="module">Module *</Label>
                <Select
                  value={taskForm.moduleId}
                  onValueChange={(value) => setTaskForm({ ...taskForm, moduleId: value })}
                  disabled={!taskForm.courseId || modulesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !taskForm.courseId ? "Select course first" :
                      modulesLoading ? "Loading modules..." :
                      "Select module"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {modulesLoading ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Loading modules...
                      </div>
                    ) : modules && modules.length > 0 ? (
                      modules.map((module: Module) => (
                        <SelectItem key={module.id} value={module.id}>
                          {module.title}
                        </SelectItem>
                      ))
                    ) : taskForm.courseId ? (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        {modulesError ? 'Error loading modules' : 'No modules available in this course'}
                      </div>
                    ) : null}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Task Title *</Label>
                <Input
                  id="title"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  placeholder="Enter task title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>

              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                <Label>Assign to Students *</Label>
                {students && students.length > 0 ? (
                  students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                      />
                      <label
                        htmlFor={`student-${student.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {student.username} {student.firstName && `(${student.firstName} ${student.lastName})`}
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No students found in your assigned courses.</p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                className="w-full"
              >
                {createTaskMutation.isPending ? "Creating..." : `Create Task for ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="h-5 w-5" />
            </div>
            Student Submissions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {tasks && tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-4">
                <ClipboardList className="h-10 w-10 text-blue-600" />
              </div>
              <p className="text-blue-700 font-medium text-lg">No tasks to review</p>
              <p className="text-sm text-blue-500 mt-1">Task submissions will appear here for review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks?.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all duration-300 hover:shadow-md"
                  data-testid={`task-${task.id}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-blue-900">{task.title}</h3>
                      {task.studentName && (
                        <p className="text-sm text-blue-600">Student: {task.studentName}</p>
                      )}
                    </div>
                    <Badge 
                      className={
                        task.status === 'submitted' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        task.status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                        'bg-blue-100 text-blue-800 border-blue-300'
                      }
                    >
                      {task.status === 'submitted' ? (
                        <><Clock className="h-3 w-3 mr-1" /> Pending Review</>
                      ) : task.status === 'approved' ? (
                        <><CheckCircle className="h-3 w-3 mr-1" /> Approved</>
                      ) : (
                        <><Clock className="h-3 w-3 mr-1" /> {task.status}</>
                      )}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-600 mb-3">{task.description}</p>
                  
                  {task.status === 'submitted' && (
                    <div className="flex items-center gap-2">
                      {task.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(task.fileUrl, '_blank')}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={() => approveTaskMutation.mutate(task.id)}
                        disabled={approveTaskMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => rejectTaskMutation.mutate(task.id)}
                        disabled={rejectTaskMutation.isPending}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </PageLayout>
  );
}
