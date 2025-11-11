import { VideoRecorder } from "@/components/VideoRecorder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function VideoRecorderDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardTitle className="text-2xl font-bold">Video Recording Demo</CardTitle>
            <p className="text-blue-100">Test the session recording functionality</p>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">How to use:</h3>
                <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
                  <li>Click "Record Session" to open the recording dialog</li>
                  <li>Configure your recording settings (quality, format, compression)</li>
                  <li>Click "Start Recording" and select the screen/window to record</li>
                  <li>Use pause/resume controls during recording</li>
                  <li>Click "Stop" when finished</li>
                  <li>Choose to save locally or upload to portal</li>
                </ol>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-blue-200">
                <div className="flex-1 space-y-1">
                  <p className="font-bold text-blue-900">Demo Session</p>
                  <p className="text-sm text-blue-600">Course: React Development Fundamentals</p>
                  <p className="text-sm text-blue-600">Student: John Doe</p>
                </div>
                <div className="flex items-center gap-3">
                  <VideoRecorder 
                    scheduleId="demo-123"
                    courseName="React Development Fundamentals"
                    studentName="John Doe"
                  />
                  <div className="flex items-center gap-2 text-sm bg-blue-100 px-3 py-2 rounded-xl">
                    <span className="font-medium text-blue-700">10:00 AM - 11:00 AM</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important Notes:</h3>
                <ul className="list-disc list-inside space-y-1 text-yellow-700 text-sm">
                  <li>Screen recording requires browser permission - click "Allow" when prompted</li>
                  <li>WebM format is faster and recommended for most use cases</li>
                  <li>Compression reduces file size but takes 1-3 minutes to process</li>
                  <li>You can cancel compression and use the original recording</li>
                  <li>Large recordings may take time to upload - please be patient</li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">✅ Features:</h3>
                <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                  <li>Real-time recording with pause/resume controls</li>
                  <li>Multiple quality settings (Low, Medium, High)</li>
                  <li>Format options (WebM for speed, MP4 for compatibility)</li>
                  <li>Optional video compression with progress tracking</li>
                  <li>Save locally or upload to portal</li>
                  <li>Activity logging for session recordings</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}