import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Square, Pause, Play, Download, Upload, Settings } from 'lucide-react';
import { useVideoRecorder } from '@/hooks/useVideoRecorder';

interface VideoRecorderProps {
  scheduleId: string;
  courseName: string;
  studentName: string;
}

interface RecordingSettings {
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
  compression: boolean;
}

export function VideoRecorder({ scheduleId, courseName, studentName }: VideoRecorderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<RecordingSettings>({
    quality: 'medium',
    format: 'webm',
    compression: false
  });
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [showSaveOptions, setShowSaveOptions] = useState(false);

  const {
    isRecording,
    isPaused,
    isProcessing,
    processingProgress,
    recordingTime,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelProcessing
  } = useVideoRecorder();

  const handleStartRecording = async () => {
    try {
      await startRecording(settings);
      setShowSettings(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please ensure you grant screen sharing permission and try again.');
    }
  };

  const handleStopRecording = async () => {
    try {
      const blob = await stopRecording(settings);
      setRecordedBlob(blob);
      setShowSaveOptions(true);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      alert('Recording stopped but processing failed. The video may still be available for download.');
      // Try to create a basic blob from chunks if available
      setShowSaveOptions(true);
    }
  };

  const downloadVideo = () => {
    if (!recordedBlob) return;
    
    const url = URL.createObjectURL(recordedBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${courseName}-${studentName}-${new Date().toISOString().split('T')[0]}.${settings.format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const uploadToPortal = async () => {
    if (!recordedBlob) return;
    
    const formData = new FormData();
    formData.append('video', recordedBlob, `session-${scheduleId}.${settings.format}`);
    formData.append('scheduleId', scheduleId);
    formData.append('courseName', courseName);
    formData.append('studentName', studentName);

    try {
      const response = await fetch('/api/upload-session-video', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        alert('Video uploaded to portal successfully!');
        setShowSaveOptions(false);
        setRecordedBlob(null);
        setIsOpen(false);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload video to portal. Please try again.');
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setShowSaveOptions(false);
    setShowSettings(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
        >
          <Video className="h-4 w-4 mr-2" />
          Record Session
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5 text-red-600" />
            Session Recording
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            <p><strong>Course:</strong> {courseName}</p>
            <p><strong>Student:</strong> {studentName}</p>
          </div>

          {!isRecording && !recordedBlob && !showSettings && (
            <div className="space-y-3">
              <Button 
                onClick={() => setShowSettings(true)}
                variant="outline"
                className="w-full"
              >
                <Settings className="h-4 w-4 mr-2" />
                Configure Settings
              </Button>
              <Button 
                onClick={handleStartRecording}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Recording
              </Button>
            </div>
          )}

          {showSettings && !isRecording && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label>Quality</Label>
                  <Select 
                    value={settings.quality} 
                    onValueChange={(value: 'low' | 'medium' | 'high') => 
                      setSettings(prev => ({ ...prev, quality: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (500kbps) - Fastest</SelectItem>
                      <SelectItem value="medium">Medium (1Mbps) - Recommended</SelectItem>
                      <SelectItem value="high">High (2.5Mbps) - Best Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select 
                    value={settings.format} 
                    onValueChange={(value: 'webm' | 'mp4') => 
                      setSettings(prev => ({ ...prev, format: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webm">WebM (Recommended - Faster)</SelectItem>
                      <SelectItem value="mp4">MP4 (Better Compatibility)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Compression</Label>
                    <p className="text-xs text-gray-500">Reduces file size but takes 1-3 minutes to process</p>
                    <p className="text-xs text-orange-600">⚠️ Disable for faster uploads</p>
                  </div>
                  <Switch 
                    checked={settings.compression}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, compression: checked }))
                    }
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSettings(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleStartRecording}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Start Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isRecording && (
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse" />
                    <span className="font-medium text-red-700">
                      {isPaused ? 'PAUSED' : 'RECORDING'}
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-red-700">
                    {recordingTime}
                  </span>
                </div>
                
                <div className="flex gap-2">
                  {!isPaused ? (
                    <Button 
                      onClick={pauseRecording}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button 
                      onClick={resumeRecording}
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  <Button 
                    onClick={handleStopRecording}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {isProcessing && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-blue-700 font-medium text-lg">Processing & Compressing Video...</p>
                <p className="text-sm text-blue-600 mb-3">Please wait while we optimize your recording</p>
                
                <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out" 
                    style={{width: `${processingProgress}%`}}
                  ></div>
                </div>
                <p className="text-sm font-medium text-blue-700 mb-3">{Math.round(processingProgress)}% Complete</p>
                
                <Button 
                  onClick={cancelProcessing}
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  Cancel & Use Original
                </Button>
                
                <p className="text-xs text-blue-500 mt-2">You can cancel to use the uncompressed video</p>
              </CardContent>
            </Card>
          )}

          {showSaveOptions && recordedBlob && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <p className="text-green-700 font-medium mb-4">Recording completed!</p>
                <div className="space-y-2">
                  <Button 
                    onClick={downloadVideo}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Locally
                  </Button>
                  <Button 
                    onClick={uploadToPortal}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Save to Portal
                  </Button>
                  <div className="flex gap-2">
                    <Button 
                      onClick={resetRecording}
                      variant="ghost"
                      className="flex-1"
                    >
                      Record Again
                    </Button>
                    <Button 
                      onClick={() => setIsOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}