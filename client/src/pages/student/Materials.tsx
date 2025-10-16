import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileText, Video, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ClassMaterial } from "@shared/schema";

export default function StudentMaterials() {
  // Fetch student's assigned materials
  const { data: materials, isLoading } = useQuery<ClassMaterial[]>({
    queryKey: ["/api/student/materials"],
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

  if (isLoading) {
    return <div className="p-8" data-testid="loading-materials">Loading materials...</div>;
  }

  const activeMaterials = materials?.filter(m => daysUntilExpiry(m.expiresAt) > 0) || [];
  const expiredMaterials = materials?.filter(m => daysUntilExpiry(m.expiresAt) <= 0) || [];

  return (
    <div className="p-8" data-testid="student-materials-page">
      <div className="mb-6">
        <h1 className="text-3xl font-bold" data-testid="page-title">Class Materials</h1>
        <p className="text-muted-foreground mt-1">
          Access your assigned course materials and resources
        </p>
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

                        <Button
                          onClick={() => handleDownload(material)}
                          className="w-full"
                          data-testid={`button-download-${material.id}`}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
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
    </div>
  );
}
