import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

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

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (fileType === 'video') {
      return (
        <video
          controls
          className="w-full h-auto max-h-[60vh] md:max-h-[70vh] rounded"
          src={fileUrl}
          style={{ maxWidth: '100%' }}
        >
          Your browser does not support the video tag.
        </video>
      );
    }

    if (fileType === 'pdf') {
      return (
        <div className="w-full h-[60vh] md:h-[70vh]">
          <iframe
            src={fileUrl}
            className="w-full h-full border-0 rounded"
            title={fileName}
            style={{ minHeight: '300px' }}
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