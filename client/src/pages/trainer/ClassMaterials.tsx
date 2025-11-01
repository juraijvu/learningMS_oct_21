import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Video, Download, Trash2, UserPlus, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLayout } from "@/components/PageLayout";
import type { ClassMaterial, Course, User } from "@shared/schema";
import { format } from "date-fns";

export default function ClassMaterials() {
  const { toast } = useToast();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<ClassMaterial | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    courseId: "",
    type: "video" as "video" | "note",
    title: "",
    description: "",
    file: null as File | null,
    allowDownload: true,
  });

  // Fetch trainer's materials
  const { data: materials, isLoading: materialsLoading } = useQuery<ClassMaterial[]>({
    queryKey: ["/api/trainer/materials"],
  });

  // Fetch courses for dropdown
  const { data: courses } = useQuery<Course[]>({
    queryKey: ["/api/courses"],
  });

  // Fetch students for assignment
  const { data: students } = useQuery<User[]>({
    queryKey: ["/api/trainer/students"],
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/api/class-materials', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload material');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/materials"] });
      toast({
        title: "Success",
        description: "Material uploaded successfully",
      });
      setUploadDialogOpen(false);
      setUploadForm({
        courseId: "",
        type: "video",
        title: "",
        description: "",
        file: null,
        allowDownload: true,
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

  // Assign mutation
  const assignMutation = useMutation({
    mutationFn: async ({ materialId, studentIds }: { materialId: string; studentIds: string[] }) => {
      return apiRequest(`/api/class-materials/${materialId}/assign`, {
        method: "POST",
        body: { studentIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/materials"] });
      queryClient.invalidateQueries({ queryKey: ["/api/class-materials"] });
      toast({
        title: "Success",
        description: "Material assigned to students successfully",
      });
      setAssignDialogOpen(false);
      setSelectedStudents([]);
      setSelectedMaterial(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest(`/api/class-materials/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/materials"] });
      toast({
        title: "Success",
        description: "Material deleted successfully",
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

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.courseId || !uploadForm.title) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append('file', uploadForm.file);
    formData.append('courseId', uploadForm.courseId);
    formData.append('type', uploadForm.type);
    formData.append('title', uploadForm.title);
    formData.append('allowDownload', uploadForm.allowDownload.toString());
    if (uploadForm.description) {
      formData.append('description', uploadForm.description);
    }

    uploadMutation.mutate(formData);
  };

  const handleAssign = () => {
    if (!selectedMaterial || selectedStudents.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one student",
        variant: "destructive",
      });
      return;
    }

    assignMutation.mutate({
      materialId: selectedMaterial.id,
      studentIds: selectedStudents,
    });
  };

  const handleDownload = async (material: ClassMaterial) => {
    window.open(`/api/class-materials/download/${material.id}`, '_blank');
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this material?")) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const daysUntilExpiry = (expiresAt: Date | string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (materialsLoading) {
    return (
      <PageLayout title="Class Materials" subtitle="Upload and manage course materials for your students">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading materials...</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Class Materials" 
      subtitle="Upload and manage course materials for your students"
      action={
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-upload-material">
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Class Material</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="course">Course *</Label>
                <Select
                  value={uploadForm.courseId}
                  onValueChange={(value) => setUploadForm({ ...uploadForm, courseId: value })}
                >
                  <SelectTrigger data-testid="select-course">
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={uploadForm.type}
                  onValueChange={(value: "video" | "note") => setUploadForm({ ...uploadForm, type: value })}
                >
                  <SelectTrigger data-testid="select-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video</SelectItem>
                    <SelectItem value="note">Note/Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter material title"
                  data-testid="input-title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Enter description (optional)"
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                  accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                  data-testid="input-file"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Max 100MB. Supported: Videos, PDFs, Word, PowerPoint, Text files
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowDownload"
                  checked={uploadForm.allowDownload}
                  onCheckedChange={(checked) => setUploadForm({ ...uploadForm, allowDownload: !!checked })}
                  data-testid="checkbox-allow-download"
                />
                <Label htmlFor="allowDownload" className="text-sm font-medium">
                  Allow students to download this file
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                If unchecked, students can only view/play the file but cannot download it
              </p>

              <Button
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
                className="w-full"
                data-testid="button-submit-upload"
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload Material"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {materials?.map((material) => {
          const daysLeft = daysUntilExpiry(material.expiresAt);
          const isExpiring = daysLeft <= 3;
          
          return (
            <Card key={material.id} data-testid={`card-material-${material.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {material.type === 'video' ? (
                      <Video className="h-5 w-5 text-blue-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-green-500" />
                    )}
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                  </div>
                </div>
                {material.description && (
                  <CardDescription>{material.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-xl">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">{material.fileName} ({formatFileSize(material.fileSize)})</span>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-sm p-3 rounded-xl ${isExpiring ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'}`}>
                    <Calendar className="h-4 w-4" />
                    <span className="font-medium">
                      {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expired'}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownload(material)}
                      className="border-blue-300 text-blue-700 hover:bg-blue-50"
                      data-testid={`button-download-${material.id}`}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedMaterial(material);
                        setAssignDialogOpen(true);
                      }}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                      data-testid={`button-assign-${material.id}`}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Assign
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(material.id)}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      data-testid={`button-delete-${material.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {materials?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No materials uploaded yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Upload your first class material to get started
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} data-testid="button-upload-first">
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Material to Students</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedMaterial && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedMaterial.title}</p>
                <p className="text-sm text-muted-foreground">{selectedMaterial.fileName}</p>
              </div>
            )}
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              <Label>Select Students:</Label>
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
                      data-testid={`checkbox-student-${student.id}`}
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
                  <p className="text-sm mt-1">Students must be enrolled in your courses to assign materials.</p>
                </div>
              )}
            </div>

            <Button
              onClick={handleAssign}
              disabled={assignMutation.isPending || selectedStudents.length === 0}
              className="w-full"
              data-testid="button-submit-assign"
            >
              {assignMutation.isPending ? "Assigning..." : `Assign to ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
