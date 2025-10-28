import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X, AlertCircle } from "lucide-react";

interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  fileType: 'video' | 'pdf' | 'document';
  allowDownload?: boolean;
}

export function MediaViewer({ 
  isOpen, 
  onClose, 
  fileUrl, 
  fileName, 
  fileType, 
  allowDownload = true 
}: MediaViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVideoError(false);
      setPdfError(false);
    }
  }, [isOpen, fileUrl]);

  const handleDownload = async () => {
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Fetch failed');
      }
    } catch (error) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const renderContent = () => {
    if (fileType === 'video') {
      if (videoError) {
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
            <p>Video cannot be played</p>
            <p className="text-sm mt-2">Try downloading the file to view it</p>
            <Button onClick={handleDownload} className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Download Video
            </Button>
          </div>
        );
      }
      
      return (
        <div className="w-full">
          <video
            ref={videoRef}
            controls
            preload="metadata"
            className="w-full h-auto max-h-[60vh] md:max-h-[70vh] rounded"
            style={{ maxWidth: '100%' }}
            onError={() => setVideoError(true)}
            onLoadStart={() => setVideoError(false)}
          >
            <source src={fileUrl} type="video/mp4" />
            <source src={fileUrl} type="video/webm" />
            <source src={fileUrl} type="video/ogg" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (fileType === 'pdf') {
      if (pdfError) {
        return (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
            <p>PDF cannot be displayed</p>
            <p className="text-sm mt-2">Try downloading the file to view it</p>
            <Button onClick={handleDownload} className="mt-4">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        );
      }
      
      return (
        <div className="w-full h-[60vh] md:h-[70vh]">
          <iframe
            ref={iframeRef}
            src={`${fileUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full border-0 rounded"
            title={fileName}
            style={{ minHeight: '300px' }}
            onError={() => setPdfError(true)}
          />
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Preview not available for this file type</p>
        <p className="text-sm mt-2">Click download to view the file</p>
      </div>
    );
  };

  const getFileTypeLabel = () => {
    switch(fileType) {
      case 'video': return 'Video player';
      case 'pdf': return 'PDF viewer';
      default: return 'Document viewer';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] md:w-full h-[90vh] md:h-[80vh] p-0 m-2 md:m-0">
        <DialogHeader className="p-2 md:p-4 border-b">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="truncate text-sm md:text-base">{fileName}</DialogTitle>
            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
              {allowDownload && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDownload} 
                  className="text-xs md:text-sm px-2 md:px-3"
                >
                  <Download className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="p-1 md:p-2">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            {getFileTypeLabel()} for {fileName}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 p-2 md:p-4 overflow-auto">
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}