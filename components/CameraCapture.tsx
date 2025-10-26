import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, XIcon, CaptureIcon } from './icons';
import Loader from './Loader';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (imageDataUrl: string) => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ isOpen, onClose, onCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      const startCamera = async () => {
        setIsLoading(true);
        setError(null);
        try {
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              videoRef.current.onloadedmetadata = () => {
                setIsLoading(false);
              };
            }
          } else {
            throw new Error('Camera not supported by this browser.');
          }
        } catch (err) {
            console.error("Error accessing camera:", err);
            let message = "Could not access the camera. Please ensure you have a webcam connected and have granted permission in your browser.";
            if (err instanceof DOMException) {
                if (err.name === 'NotAllowedError') {
                    message = "Camera access was denied. Please grant permission in your browser settings to use this feature.";
                } else if (err.name === 'NotFoundError') {
                    message = "No camera was found. Please make sure a webcam is connected.";
                }
            }
            setError(message);
            setIsLoading(false);
        }
      };
      startCamera();
    } else {
      stopCamera();
    }
    
    // Cleanup function
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageDataUrl);
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700">
        <header className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200 flex items-center gap-2">
            <CameraIcon className="w-6 h-6" /> Use Webcam
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
            <XIcon className="w-6 h-6" />
          </button>
        </header>

        <div className="p-4 flex-grow relative flex items-center justify-center bg-black rounded-b-lg">
          {isLoading && !error && <Loader />}
          {error && (
            <div className="text-center text-red-400 p-4 bg-red-900/50 rounded-lg">
              <p className="font-bold">Camera Error</p>
              <p className="text-sm mt-2">{error}</p>
            </div>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
          />
          <canvas ref={canvasRef} className="hidden" />
        </div>
        
        {!isLoading && !error && (
             <footer className="p-4 border-t border-gray-700">
                <button
                    onClick={handleCapture}
                    className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-500 transition-colors text-lg"
                    aria-label="Snap Photo"
                >
                    <CaptureIcon className="w-8 h-8"/>
                    Snap Photo
                </button>
            </footer>
        )}
      </div>
    </div>
  );
};

export default CameraCapture;
