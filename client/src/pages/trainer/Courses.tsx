import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Users, FileText, Upload, Video, FileIcon } from "lucide-react";
import { PageLayout } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssignedCourse {
  id: string;
  title: string;
  description: string;
  pdfUrl?: string;
  studentCount: number;
  moduleCount: number;
}

interface ClassMaterial {
  id: string;
  type: 'video' | 'note';
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string;
}

const uploadSchema = z.object({
  type: z.enum(['video', 'note']),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  file: z.any().refine((files) => files?.length > 0, "File is required"),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

function UploadMaterialDialog({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      type: 'note',
      title: '',
      description: '',
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (values: UploadFormValues) => {
      const formData = new FormData();
      formData.append('courseId', courseId);
      formData.append('type', values.type);
      formData.append('title', values.title);
      if (values.description) formData.append('description', values.description);
      formData.append('file', values.file[0]);

      const res = await fetch('/api/class-materials', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Material uploaded successfully. It will be available for 10 days.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/class-materials/${courseId}`] });
      form.reset();
      setOpen(false);
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload material",
      });
    },
  });

  const onSubmit = (values: UploadFormValues) => {
    uploadMutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid={`button-upload-material-${courseId}`}>
          <Upload className="h-4 w-4 mr-1" />
          Share Materials
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Class Material</DialogTitle>
          <DialogDescription>
            Share videos or notes with your students. Files will be automatically deleted after 10 days.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-material-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="note">Note/Document</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Week 1 Lecture Video" {...field} data-testid="input-material-title" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of the material" 
                      {...field} 
                      data-testid="input-material-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="video/*,.pdf,.doc,.docx,.ppt,.pptx,.txt"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                      data-testid="input-material-file"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-upload">
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending} data-testid="button-submit-upload">
                {uploadMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CourseMaterials({ courseId }: { courseId: string }) {
  const { data: materials, isLoading } = useQuery<ClassMaterial[]>({
    queryKey: [`/api/class-materials/${courseId}`],
  });

  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: (materialId: string) => 
      apiRequest('DELETE', `/api/class-materials/${materialId}`),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Material deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/class-materials/${courseId}`] });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete material",
      });
    },
  });

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!materials || materials.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-2">
        No materials shared yet
      </div>
    );
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const daysUntilExpiry = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-2">
      {materials.map((material) => (
        <div
          key={material.id}
          className="flex items-center gap-3 p-2 rounded border bg-muted/30"
          data-testid={`material-${material.id}`}
        >
          <div className="flex-shrink-0">
            {material.type === 'video' ? (
              <Video className="h-4 w-4 text-muted-foreground" />
            ) : (
              <FileIcon className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{material.title}</p>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(material.fileSize)} • Expires in {daysUntilExpiry(material.expiresAt)} days
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => deleteMutation.mutate(material.id)}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-material-${material.id}`}
          >
            Delete
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function TrainerCourses() {
  const { data: courses, isLoading } = useQuery<AssignedCourse[]>({
    queryKey: ["/api/trainer/courses"],
  });

  if (isLoading) {
    return (
      <PageLayout title="My Courses" subtitle="Manage your assigned courses and share materials">
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Skeleton className="h-6 w-3/4 bg-white/20" />
                <Skeleton className="h-4 w-full mt-2 bg-white/20" />
              </CardHeader>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="My Courses" 
      subtitle="Manage your assigned courses and share materials"
    >
      {courses && courses.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-blue-400 mb-4" />
            <p className="text-blue-600 text-center font-medium">No courses assigned yet</p>
            <p className="text-sm text-blue-500 text-center mt-1">Contact admin for course assignments</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {courses?.map((course) => (
            <Card key={course.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300" data-testid={`card-course-${course.id}`}>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg text-white">{course.title}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2 text-blue-100">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-sm bg-blue-50 p-3 rounded-xl">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-blue-700 font-medium">{course.studentCount} students</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded-xl">
                    <BookOpen className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">{course.moduleCount} modules</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-blue-900">Shared Materials</p>
                    <UploadMaterialDialog courseId={course.id} />
                  </div>
                  <CourseMaterials courseId={course.id} />
                </div>

                <div className="flex gap-2">
                  {course.pdfUrl && (
                    <Button variant="outline" size="sm" asChild className="border-blue-300 text-blue-700 hover:bg-blue-50">
                      <a href={course.pdfUrl} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-1" />
                        PDF
                      </a>
                    </Button>
                  )}
                  <Button size="sm" asChild className="flex-1 bg-blue-600 hover:bg-blue-700">
                    <a href={`/courses/${course.id}/students`} data-testid={`button-view-students-${course.id}`}>
                      View Students
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
