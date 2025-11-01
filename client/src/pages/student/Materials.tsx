import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Video, Calendar, AlertCircle, Eye, RefreshCw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageLayout } from "@/components/PageLayout";
import { MediaViewer } from "@/components/MediaViewer";
import type { ClassMaterial } from "@shared/schema";

export default function StudentMaterials() {
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    fileUrl: string;
    fileName: string;
    fileType: 'video' | 'pdf' | 'document';
  }>({ isOpen: false, fileUrl: '', fileName: '', fileType: 'document' });

  // Fetch student's assigned materials
  const { data: materials, isLoading, refetch } = useQuery<ClassMaterial[]>({
    queryKey: ["/api/student/materials"],
    staleTime: 0,
    cacheTime: 0,
  });

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

  const handleDownload = (material: ClassMaterial) => {
    window.open(`/api/class-materials/download/${material.id}`, '_blank');
  };

  const handleView = (material: ClassMaterial) => {
    const fileType = material.type === 'video' ? 'video' : 
                    material.fileName.toLowerCase().endsWith('.pdf') ? 'pdf' : 'document';
    
    setViewerState({
      isOpen: true,
      fileUrl: `/api/class-materials/view/${material.id}`,
      fileName: material.fileName,
      fileType
    });
  };

  if (isLoading) {
    return (
      <PageLayout title="Class Materials" subtitle="Access your assigned course materials and resources">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading materials...</p>
        </div>
      </PageLayout>
    );
  }

  const activeMaterials = materials?.filter(m => daysUntilExpiry(m.expiresAt) > 0) || [];
  const expiredMaterials = materials?.filter(m => daysUntilExpiry(m.expiresAt) <= 0) || [];

  return (
    <PageLayout 
      title="Class Materials" 
      subtitle="Access your assigned course materials and resources"
    >
      <div className="mb-4">
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {activeMaterials.length === 0 && expiredMaterials.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No materials assigned yet</p>
            <p className="text-sm text-muted-foreground">
              Your trainer will assign materials to you when available
            </p>
          </CardContent>
        </Card>
      )}

      {activeMaterials.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Materials</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeMaterials.map((material) => {
                const daysLeft = daysUntilExpiry(material.expiresAt);
                const isExpiring = daysLeft <= 3;
                
                return (
                  <Card key={material.id} data-testid={`card-material-${material.id}`}>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        {material.type === 'video' ? (
                          <Video className="h-5 w-5 text-blue-500" />
                        ) : (
                          <FileText className="h-5 w-5 text-green-500" />
                        )}
                        <CardTitle className="text-lg">{material.title}</CardTitle>
                      </div>
                      {material.description && (
                        <CardDescription>{material.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span>{material.fileName} ({formatFileSize(material.fileSize)})</span>
                        </div>
                        
                        {isExpiring && (
                          <Alert variant="destructive" className="py-2">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}! Download soon.
                            </AlertDescription>
                          </Alert>
                        )}
                        
                        {!isExpiring && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>Available for {daysLeft} more day{daysLeft !== 1 ? 's' : ''}</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleView(material)}
                            variant="outline"
                            className="flex-1"
                            data-testid={`button-view-${material.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          {material.allowDownload ? (
                            <Button
                              onClick={() => handleDownload(material)}
                              className="flex-1"
                              data-testid={`button-download-${material.id}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </Button>
                          ) : (
                            <Button
                              disabled
                              variant="outline"
                              className="flex-1 opacity-50"
                              title="Download disabled by trainer"
                              data-testid={`button-download-disabled-${material.id}`}
                            >
                              <Download className="h-4 w-4 mr-2" />
                              View Only
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {expiredMaterials.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Expired Materials</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {expiredMaterials.map((material) => (
              <Card key={material.id} className="opacity-60" data-testid={`card-expired-${material.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    {material.type === 'video' ? (
                      <Video className="h-5 w-5 text-gray-400" />
                    ) : (
                      <FileText className="h-5 w-5 text-gray-400" />
                    )}
                    <CardTitle className="text-lg text-muted-foreground">{material.title}</CardTitle>
                  </div>
                  {material.description && (
                    <CardDescription>{material.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      <span>{material.fileName}</span>
                    </div>
                    
                    <Alert className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        This material has expired and is no longer available
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      
      <MediaViewer
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState(prev => ({ ...prev, isOpen: false }))}
        fileUrl={viewerState.fileUrl}
        fileName={viewerState.fileName}
        fileType={viewerState.fileType}
        allowDownload={materials?.find(m => `/api/class-materials/view/${m.id}` === viewerState.fileUrl)?.allowDownload ?? true}
      />
    </PageLayout>
  );
}
