import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { apiRequest } from '@/lib/queryClient';
import { Award, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CertificateRequest {
  id: string;
  courseId: string;
  status: 'requested' | 'issued' | 'rejected';
  certificateUrl?: string;
  requestedAt: string;
  issuedAt?: string;
  courseTitle: string;
  issuerName?: string;
}

interface Course {
  id: string;
  title: string;
  moduleCount: number;
  completedModules: number;
}

export default function Certificates() {
  const [requests, setRequests] = useState<CertificateRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isRequirementDialogOpen, setIsRequirementDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [completionStatus, setCompletionStatus] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [requestsRes, coursesRes] = await Promise.all([
        apiRequest('/api/student/certificates'),
        apiRequest('/api/student/courses'),
      ]);

      setRequests(requestsRes);
      setCourses(coursesRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCourseCompletion = async (courseId: string) => {
    try {
      const status = await apiRequest(`/api/student/courses/${courseId}/completion`);
      return status;
    } catch (error) {
      console.error('Error checking course completion:', error);
      return null;
    }
  };

  const handleRequestCertificate = async (course: Course) => {
    const status = await checkCourseCompletion(course.id);
    setCompletionStatus(status);
    setSelectedCourse(course);
    
    if (status?.isEligible) {
      setIsConfirmDialogOpen(true);
    } else {
      setIsRequirementDialogOpen(true);
    }
  };

  const confirmCertificateRequest = async () => {
    if (!selectedCourse) return;
    
    try {
      await apiRequest('/api/student/certificates', {
        method: 'POST',
        body: { courseId: selectedCourse.id },
      });
      setIsConfirmDialogOpen(false);
      setSelectedCourse(null);
      fetchData();
    } catch (error) {
      console.error('Error requesting certificate:', error);
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
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'requested':
        return <Badge variant="secondary">Processing</Badge>;
      case 'issued':
        return <Badge variant="default" className="bg-green-500">Ready</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const isEligibleForCertificate = (course: Course) => {
    return course.completedModules === course.moduleCount && course.moduleCount > 0;
  };

  const hasRequestedCertificate = (courseId: string) => {
    return requests.some(r => r.courseId === courseId);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">My Certificates</h1>
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          <span className="text-sm text-muted-foreground">
            {requests.filter(r => r.status === 'issued').length} certificates earned
          </span>
        </div>
      </div>

      {/* Certificate Requests */}
      {requests.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Certificate Requests</h2>
          <div className="grid gap-4">
            {requests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        {request.courseTitle}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                      {request.issuedAt && (
                        <p className="text-sm text-muted-foreground">
                          Issued: {new Date(request.issuedAt).toLocaleDateString()}
                        </p>
                      )}
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
                      {request.status === 'requested' && (
                        <p className="text-sm text-muted-foreground">
                          Your certificate request is being processed by our sales team.
                        </p>
                      )}
                      {request.status === 'rejected' && (
                        <p className="text-sm text-red-600">
                          Your certificate request was rejected. Please contact support for more information.
                        </p>
                      )}
                      {request.status === 'issued' && (
                        <p className="text-sm text-green-600">
                          Congratulations! Your certificate is ready for download.
                        </p>
                      )}
                    </div>
                    {request.status === 'issued' && request.certificateUrl && (
                      <Button
                        onClick={() => handleDownloadCertificate(request.id)}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Courses */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Course Completion Status</h2>
        <div className="grid gap-4">
          {courses.map((course) => {
            const isEligible = isEligibleForCertificate(course);
            const hasRequested = hasRequestedCertificate(course.id);
            const progressPercentage = course.moduleCount > 0 
              ? Math.round((course.completedModules / course.moduleCount) * 100) 
              : 0;

            return (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{course.title}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Progress: {course.completedModules}/{course.moduleCount} modules completed ({progressPercentage}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEligible ? (
                        <Badge variant="default" className="bg-green-500">Completed</Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      {!isEligible && (
                        <p className="text-sm text-muted-foreground">
                          Complete all modules to become eligible for a certificate.
                        </p>
                      )}
                      {isEligible && !hasRequested && (
                        <p className="text-sm text-green-600">
                          Congratulations! You're eligible to request a certificate.
                        </p>
                      )}
                      {isEligible && hasRequested && (
                        <p className="text-sm text-blue-600">
                          Certificate request submitted. Check the status above.
                        </p>
                      )}
                    </div>
                    {isEligible && !hasRequested && (
                      <Button
                        onClick={() => handleRequestCertificate(course)}
                        className="ml-4"
                      >
                        <Award className="h-4 w-4 mr-2" />
                        Request Certificate
                      </Button>
                    )}
                    {!isEligible && (
                      <Button
                        variant="outline"
                        onClick={() => handleRequestCertificate(course)}
                        className="ml-4"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Check Requirements
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No courses enrolled yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Certificate</DialogTitle>
          </DialogHeader>
          {selectedCourse && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <p className="font-medium text-green-800">Course Completed!</p>
                </div>
                <p className="text-sm text-green-700">
                  Congratulations! You have successfully completed <strong>{selectedCourse.title}</strong>.
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Completion Summary:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>✅ All modules completed ({completionStatus?.completedModules}/{completionStatus?.totalModules})</li>
                  <li>✅ Final project approved</li>
                </ul>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Are you sure you want to request a certificate for this course? 
                Your request will be sent to our sales team for processing.
              </p>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={confirmCertificateRequest}
                  className="flex-1"
                >
                  <Award className="h-4 w-4 mr-2" />
                  Request Certificate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Requirements Dialog */}
      <Dialog open={isRequirementDialogOpen} onOpenChange={setIsRequirementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Certificate Requirements</DialogTitle>
          </DialogHeader>
          {selectedCourse && completionStatus && (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <p className="font-medium text-yellow-800">Course Not Complete</p>
                </div>
                <p className="text-sm text-yellow-700">
                  You need to complete the following requirements for <strong>{selectedCourse.title}</strong> before requesting a certificate:
                </p>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm font-medium">Outstanding Requirements:</p>
                <ul className="space-y-2">
                  {completionStatus.incompleteItems.map((item: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Next Steps:</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-1 space-y-1">
                  <li>• Complete all course modules</li>
                  <li>• Submit all required projects</li>
                  <li>• Wait for final project approval</li>
                </ul>
              </div>
              
              <Button 
                onClick={() => setIsRequirementDialogOpen(false)}
                className="w-full"
              >
                I Understand
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}