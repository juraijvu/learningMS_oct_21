import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BookOpen, FileText, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PageLayout } from "@/components/PageLayout";
import type { Course } from "@shared/schema";

const COURSE_CATEGORIES = [
  "Programming",
  "Web Development",
  "Data Science",
  "Design",
  "Business",
  "Marketing",
  "Photography",
  "Music",
  "Language",
  "Other"
];

export default function CoursesManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", category: "", imageUrl: "", pdfUrl: "" });
  const [coursePageUrl, setCoursePageUrl] = useState("");
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const { toast } = useToast();

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/admin/courses"],
  });

  const createCourseMutation = useMutation({
    mutationFn: async (courseData: typeof newCourse) => {
      return await apiRequest("/api/admin/courses", { method: "POST", body: courseData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses"] });
      toast({ title: "Success", description: "Course created successfully" });
      setIsDialogOpen(false);
      setNewCourse({ title: "", description: "", category: "", imageUrl: "", pdfUrl: "" });
      setCoursePageUrl("");
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleFetchMetadata = async () => {
    if (!coursePageUrl) {
      toast({ title: "Error", description: "Please enter a course page URL", variant: "destructive" });
      return;
    }

    setIsFetchingMetadata(true);
    try {
      const response = await apiRequest("/api/admin/courses/fetch-metadata", { method: "POST", body: { url: coursePageUrl } }) as any;
      
      setNewCourse({
        ...newCourse,
        title: response.title || newCourse.title,
        description: response.description || newCourse.description,
        imageUrl: response.imageUrl || newCourse.imageUrl,
      });
      
      toast({ 
        title: "Success", 
        description: "Course details fetched successfully from the page!" 
      });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to fetch course details", 
        variant: "destructive" 
      });
    } finally {
      setIsFetchingMetadata(false);
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Course Management" subtitle="Loading courses...">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </PageLayout>
    );
  }

  const createButton = (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" data-testid="button-create-course">
          <Plus className="mr-2 h-5 w-5" />
          Create Course
        </Button>
      </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
              <DialogDescription>Add a new course to the system</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <Label htmlFor="coursePageUrl" className="text-base font-semibold">
                  ✨ Course Page URL (from orbittraining.ae)
                </Label>
                <p className="text-xs text-muted-foreground mb-3 mt-1">
                  Paste the course page URL and we'll automatically extract the title, description, and image!
                </p>
                <div className="flex gap-2">
                  <Input
                    id="coursePageUrl"
                    value={coursePageUrl}
                    onChange={(e) => setCoursePageUrl(e.target.value)}
                    data-testid="input-course-page-url"
                    placeholder="https://orbittraining.ae/courses/autocad-training-course-in-dubai-4/"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleFetchMetadata}
                    disabled={isFetchingMetadata || !coursePageUrl}
                    data-testid="button-fetch-metadata"
                    type="button"
                  >
                    {isFetchingMetadata ? "Fetching..." : "Fetch"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  data-testid="input-course-title"
                  placeholder="Auto-filled from course page"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  data-testid="input-course-description"
                  placeholder="Auto-filled from course page"
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newCourse.category}
                  onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                >
                  <SelectTrigger data-testid="select-course-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COURSE_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category} data-testid={`option-category-${category}`}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Course Image URL (Auto-filled)</Label>
                <Input
                  id="imageUrl"
                  value={newCourse.imageUrl}
                  onChange={(e) => setNewCourse({ ...newCourse, imageUrl: e.target.value })}
                  data-testid="input-course-image"
                  placeholder="Auto-filled from course page"
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pdfUrl">Course PDF URL (Optional)</Label>
                <Input
                  id="pdfUrl"
                  value={newCourse.pdfUrl}
                  onChange={(e) => setNewCourse({ ...newCourse, pdfUrl: e.target.value })}
                  data-testid="input-course-pdf"
                  placeholder="https://example.com/course-material.pdf"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => createCourseMutation.mutate(newCourse)}
                disabled={createCourseMutation.isPending}
                data-testid="button-submit-course"
              >
                {createCourseMutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </DialogContent>
    </Dialog>
  );

  return (
    <PageLayout 
      title="Course Management" 
      subtitle="Create and manage all courses in the system"
      action={createButton}
    >
      {courses && courses.length === 0 ? (
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <BookOpen className="h-10 w-10 text-blue-500" />
            </div>
            <p className="text-blue-600 font-semibold text-center">No courses created yet</p>
            <p className="text-blue-500 text-center mt-1">Create your first course to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses?.map((course) => (
            <Card key={course.id} className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" data-testid={`card-course-${course.id}`}>
              {course.imageUrl && (
                <div className="w-full h-48 overflow-hidden bg-muted">
                  <img 
                    src={course.imageUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <div className="flex items-start gap-3">
                  {!course.imageUrl && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white/20">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-white">{course.title}</CardTitle>
                    {course.category && (
                      <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                        <Tag className="h-3 w-3 mr-1" />
                        {course.category}
                      </Badge>
                    )}
                    <CardDescription className="mt-2 line-clamp-2 text-blue-100">
                      {course.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {course.pdfUrl && (
                  <a 
                    href={course.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Course PDF
                  </a>
                )}
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" asChild className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <a href={`/courses/${course.id}/modules`}>Manage Modules</a>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50">
                    <a href={`/courses/${course.id}/assign`}>Assign Trainers</a>
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
