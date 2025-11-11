import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface VideoRecorderOptions {
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
  mimeType?: string;
}

interface RecordingSettings {
  quality: 'low' | 'medium' | 'high';
  format: 'webm' | 'mp4';
  compression: boolean;
}

export const useVideoRecorder = (options: VideoRecorderOptions = {}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const processingCancelRef = useRef<boolean>(false);

  const getQualitySettings = (quality: 'low' | 'medium' | 'high') => {
    const settings = {
      low: { videoBitsPerSecond: 500000, audioBitsPerSecond: 64000 },
      medium: { videoBitsPerSecond: 1000000, audioBitsPerSecond: 128000 },
      high: { videoBitsPerSecond: 2500000, audioBitsPerSecond: 192000 }
    };
    return settings[quality];
  };

  const initFFmpeg = async () => {
    if (!ffmpegRef.current) {
      const ffmpeg = new FFmpeg();
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      // Add timeout for FFmpeg loading
      const loadTimeout = setTimeout(() => {
        throw new Error('FFmpeg loading timeout');
      }, 30000); // 30 seconds timeout
      
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        });
        clearTimeout(loadTimeout);
        ffmpegRef.current = ffmpeg;
      } catch (error) {
        clearTimeout(loadTimeout);
        throw error;
      }
    }
    return ffmpegRef.current;
  };

  const startRecording = useCallback(async (settings: RecordingSettings) => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: 'screen' },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      const qualitySettings = getQualitySettings(settings.quality);
      const mimeType = settings.format === 'mp4' ? 'video/mp4' : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm;codecs=vp9,opus',
        audioBitsPerSecond: qualitySettings.audioBitsPerSecond,
        videoBitsPerSecond: qualitySettings.videoBitsPerSecond,
        ...options
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // State is already updated in stopRecording
        // Just ensure timer is cleared
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [options]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, [isRecording, isPaused]);

  const stopRecording = useCallback(async (settings: RecordingSettings) => {
    return new Promise<Blob>((resolve) => {
      if (mediaRecorderRef.current && isRecording) {
        // Stop timer immediately when stop is called
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Update state immediately
        setIsRecording(false);
        setIsPaused(false);
        
        mediaRecorderRef.current.onstop = async () => {
          const blob = new Blob(chunksRef.current, { 
            type: settings.format === 'mp4' ? 'video/mp4' : 'video/webm' 
          });
          
          if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
          }
          
          let finalBlob = blob;
          
          if (settings.compression) {
            setIsProcessing(true);
            setProcessingProgress(0);
            processingCancelRef.current = false;
            
            try {
              finalBlob = await compressVideo(blob, settings);
            } catch (error) {
              console.error('Compression failed, using original:', error);
              // If compression fails, use original blob
              finalBlob = blob;
            }
            setIsProcessing(false);
            setProcessingProgress(0);
          }
          
          resolve(finalBlob);
        };
        
        mediaRecorderRef.current.stop();
      }
    });
  }, [isRecording]);

  const compressVideo = async (blob: Blob, settings: RecordingSettings): Promise<Blob> => {
    return new Promise(async (resolve, reject) => {
      // Set timeout for compression (3 minutes max)
      const timeout = setTimeout(() => {
        processingCancelRef.current = true;
        reject(new Error('Video compression timeout'));
      }, 3 * 60 * 1000);
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        if (processingCancelRef.current) {
          clearInterval(progressInterval);
          return;
        }
        setProcessingProgress(prev => Math.min(prev + Math.random() * 15, 90));
      }, 1000);
      
      try {
        if (processingCancelRef.current) {
          throw new Error('Processing cancelled');
        }
        
        const ffmpeg = await initFFmpeg();
        const inputName = 'input.webm';
        const outputName = `output.${settings.format}`;
        
        setProcessingProgress(20);
        
        if (processingCancelRef.current) {
          throw new Error('Processing cancelled');
        }
        
        await ffmpeg.writeFile(inputName, await fetchFile(blob));
        setProcessingProgress(40);
        
        if (processingCancelRef.current) {
          throw new Error('Processing cancelled');
        }
        
        // Use faster compression settings
        const compressionArgs = settings.quality === 'low' 
          ? ['-crf', '30', '-preset', 'ultrafast']
          : settings.quality === 'medium'
          ? ['-crf', '26', '-preset', 'fast'] 
          : ['-crf', '22', '-preset', 'medium'];
        
        setProcessingProgress(60);
        
        await ffmpeg.exec([
          '-i', inputName,
          '-c:v', 'libx264',
          '-c:a', 'aac',
          '-movflags', '+faststart',
          ...compressionArgs,
          '-y',
          outputName
        ]);
        
        setProcessingProgress(90);
        
        if (processingCancelRef.current) {
          throw new Error('Processing cancelled');
        }
        
        const data = await ffmpeg.readFile(outputName);
        setProcessingProgress(100);
        
        clearTimeout(timeout);
        clearInterval(progressInterval);
        resolve(new Blob([data], { type: `video/${settings.format}` }));
      } catch (error) {
        clearTimeout(timeout);
        clearInterval(progressInterval);
        reject(error);
      }
    });
  };

  const cancelProcessing = useCallback(() => {
    processingCancelRef.current = true;
    setIsProcessing(false);
    setProcessingProgress(0);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return {
    isRecording,
    isPaused,
    isProcessing,
    processingProgress,
    recordingTime: formatTime(recordingTime),
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelProcessing
  };
};