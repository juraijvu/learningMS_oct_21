import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Upload, Download, Trash2, Share, FileText, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface TrainerSharedFile {
  id: string;
  uploadedBy: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  expiresAt: string;
  uploaderName?: string;
}

interface Trainer {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
}

export default function SharedFiles() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<TrainerSharedFile | null>(null);
  const [selectedTrainers, setSelectedTrainers] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; file: TrainerSharedFile | null }>({ open: false, file: null });
  const [uploadForm, setUploadForm] = useState({ title: "", description: "", file: null as File | null });
  const { toast } = useToast();

  const { data: uploadedFiles, isLoading: loadingUploaded } = useQuery<TrainerSharedFile[]>({
    queryKey: ["/api/trainer/shared-files/uploaded"],
  });

  const { data: assignedFiles, isLoading: loadingAssigned } = useQuery<TrainerSharedFile[]>({
    queryKey: ["/api/trainer/shared-files/assigned"],
  });

  const { data: trainers } = useQuery<Trainer[]>({
    queryKey: ["/api/trainer/trainers"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('title', data.title);
      formData.append('description', data.description);
      
      const response = await fetch('/api/trainer/shared-files', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Upload failed' }));
        throw new Error(errorData.message || 'Upload failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/shared-files/uploaded"] });
      toast({ title: "Success", description: "File uploaded successfully" });
      setIsUploadDialogOpen(false);
      setUploadForm({ title: "", description: "", file: null });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: async ({ fileId, trainerIds }: { fileId: string; trainerIds: string[] }) => {
      return await apiRequest("POST", `/api/trainer/shared-files/${fileId}/assign`, { trainerIds });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "File assigned successfully" });
      setIsAssignDialogOpen(false);
      setSelectedFile(null);
      setSelectedTrainers([]);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      return await apiRequest("DELETE", `/api/trainer/shared-files/${fileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trainer/shared-files/uploaded"] });
      toast({ title: "Success", description: "File deleted successfully" });
      setConfirmDelete({ open: false, file: null });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleUpload = () => {
    if (!uploadForm.file || !uploadForm.title) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    uploadMutation.mutate(uploadForm);
  };

  const handleAssign = () => {
    if (!selectedFile || selectedTrainers.length === 0) {
      toast({ title: "Error", description: "Please select trainers to assign", variant: "destructive" });
      return;
    }
    assignMutation.mutate({ fileId: selectedFile.id, trainerIds: selectedTrainers });
  };

  const handleDownload = (file: TrainerSharedFile) => {
    window.open(`/api/trainer/shared-files/download/${file.id}`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Shared Files</h1>
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Shared File</DialogTitle>
              <DialogDescription>Upload a file to share with other trainers (expires in 5 days)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  placeholder="Enter file title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  placeholder="Enter file description"
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                />
              </div>
              <Button 
                className="w-full" 
                onClick={handleUpload}
                disabled={uploadMutation.isPending}
              >
                {uploadMutation.isPending ? "Uploading..." : "Upload File"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="uploaded" className="space-y-4">
        <TabsList>
          <TabsTrigger value="uploaded">My Uploads</TabsTrigger>
          <TabsTrigger value="assigned">Shared with Me</TabsTrigger>
        </TabsList>

        <TabsContent value="uploaded" className="space-y-4">
          {loadingUploaded ? (
            <div>Loading...</div>
          ) : uploadedFiles?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No files uploaded yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {uploadedFiles?.map((file) => {
                const daysLeft = getDaysUntilExpiry(file.expiresAt);
                return (
                  <Card key={file.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{file.title}</CardTitle>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedFile(file);
                              setIsAssignDialogOpen(true);
                            }}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmDelete({ open: true, file })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{file.fileName}</span>
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                        <Badge variant={daysLeft <= 1 ? "destructive" : daysLeft <= 2 ? "secondary" : "default"}>
                          {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned" className="space-y-4">
          {loadingAssigned ? (
            <div>Loading...</div>
          ) : assignedFiles?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">No files shared with you</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {assignedFiles?.map((file) => {
                const daysLeft = getDaysUntilExpiry(file.expiresAt);
                return (
                  <Card key={file.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{file.title}</CardTitle>
                          {file.description && (
                            <p className="text-sm text-muted-foreground mt-1">{file.description}</p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {file.uploaderName}
                        </span>
                        <span>{file.fileName}</span>
                        <span>{formatFileSize(file.fileSize)}</span>
                        <span>Uploaded: {formatDate(file.uploadedAt)}</span>
                        <Badge variant={daysLeft <= 1 ? "destructive" : daysLeft <= 2 ? "secondary" : "default"}>
                          {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign File to Trainers</DialogTitle>
            <DialogDescription>Select trainers to share "{selectedFile?.title}" with</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-96 overflow-y-auto">
            {trainers?.map((trainer) => (
              <div key={trainer.id} className="flex items-center space-x-2">
                <Checkbox
                  id={trainer.id}
                  checked={selectedTrainers.includes(trainer.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedTrainers([...selectedTrainers, trainer.id]);
                    } else {
                      setSelectedTrainers(selectedTrainers.filter(id => id !== trainer.id));
                    }
                  }}
                />
                <Label htmlFor={trainer.id} className="flex-1 cursor-pointer">
                  {trainer.firstName && trainer.lastName 
                    ? `${trainer.firstName} ${trainer.lastName} (${trainer.username})`
                    : trainer.username
                  }
                </Label>
              </div>
            ))}
          </div>
          <Button 
            className="w-full" 
            onClick={handleAssign}
            disabled={assignMutation.isPending || selectedTrainers.length === 0}
          >
            {assignMutation.isPending ? "Assigning..." : `Assign to ${selectedTrainers.length} trainer(s)`}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete({ open, file: null })}
        title="Delete File"
        description={`Are you sure you want to delete "${confirmDelete.file?.title}"? This action cannot be undone.`}
        variant="destructive"
        onConfirm={() => confirmDelete.file && deleteMutation.mutate(confirmDelete.file.id)}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}