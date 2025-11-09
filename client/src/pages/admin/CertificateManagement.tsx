import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';
import { Award, Upload, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

interface CertificateRequest {
  id: string;
  studentId: string;
  courseId: string;
  status: 'requested' | 'issued' | 'rejected';
  certificateUrl?: string;
  issuedBy?: string;
  requestedAt: string;
  issuedAt?: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  issuerName?: string;
}

export default function CertificateManagement() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequest | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await apiRequest('/api/admin/certificates');
      setRequests(response);
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
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

  const handleIssueCertificate = async () => {
    if (!selectedRequest || !selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('certificate', selectedFile);

      const response = await fetch(`/api/admin/certificates/${selectedRequest.id}/issue`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to issue certificate');
      }

      setIsIssueDialogOpen(false);
      setSelectedRequest(null);
      setSelectedFile(null);
      fetchRequests();
    } catch (error) {
      console.error('Error issuing certificate:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await apiRequest(`/api/admin/certificates/${requestId}/reject`, {
        method: 'PATCH',
      });
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting certificate request:', error);
    }
  };

  const handleDownloadCertificate = (requestId: string) => {
    const link = document.createElement('a');
    link.href = `/api/certificates/download/${requestId}`;
    link.download = `certificate-${requestId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'requested':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="secondary">Pending</Badge>;
      case 'issued':
        return <Badge variant="default" className="bg-green-500">Issued</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'requested');
  const processedRequests = requests.filter(r => r.status !== 'requested');

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Certificate Management</h1>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {pendingRequests.length} pending requests
          </span>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Requests</h2>
          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <Card key={request.id} className="border-yellow-200">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {request.studentName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Student Email: {request.studentEmail}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsIssueDialogOpen(true);
                        }}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Issue Certificate
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Processed Requests</h2>
          <div className="grid gap-4">
            {processedRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {request.studentName}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {request.courseTitle}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                        {request.issuedAt && (
                          <> • Issued: {new Date(request.issuedAt).toLocaleDateString()}</>
                        )}
                      </p>
                      {request.issuerName && (
                        <p className="text-xs text-muted-foreground">
                          Issued by: {request.issuerName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(request.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Student Email: {request.studentEmail}
                      </p>
                    </div>
                    {request.status === 'issued' && request.certificateUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadCertificate(request.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {requests.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No certificate requests yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Issue Certificate Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Certificate</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedRequest.studentName}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.courseTitle}</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.studentEmail}</p>
              </div>

              <div>
                <Label htmlFor="certificate">Upload Certificate (PDF)</Label>
                <Input
                  id="certificate"
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Please upload the signed certificate in PDF format
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
                onClick={handleIssueCertificate}
                disabled={!selectedFile || uploading}
                className="w-full"
              >
                {uploading ? 'Uploading...' : 'Issue Certificate'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}