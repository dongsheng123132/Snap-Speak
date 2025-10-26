import React, { useState, useRef, useCallback } from 'react';
import type { AnalysisResult, ProcessingStatus } from '../types';
import { analyzeImage } from '../services/chromeAiService';
import { speak } from '../utils/speech';
import { CameraIcon, UploadIcon, SparklesIcon, RefreshIcon, SpeakerIcon, CameraFlipIcon } from './icons';
import Loader from './Loader';
import CameraCapture from './CameraCapture';

// Helper function to convert a file to a base64 string
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
};

const ImageAnalyzer: React.FC = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processAnalysis = useCallback(async (base64Data: string, previewUrl: string) => {
    resetState(false); // Don't reset everything, just the analysis part
    setImagePreviewUrl(previewUrl);
    setStatus('processing');
    try {
      const analysisResult = await analyzeImage(base64Data);
      setResult(analysisResult);
      setStatus('success');
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(errorMessage);
      setStatus('error');
    }
  }, []);

  const handleImageChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const previewUrl = URL.createObjectURL(file);
    const base64Data = await fileToBase64(file);
    processAnalysis(base64Data, previewUrl);
    
    // Reset file input to allow selecting the same file again
    if(event.target) event.target.value = "";
  }, [processAnalysis]);
  
  const handleCameraCapture = useCallback((imageDataUrl: string) => {
    // The data URL from canvas already has the prefix, let's get just the base64 part
    const base64Data = imageDataUrl.split(',')[1];
    processAnalysis(base64Data, imageDataUrl);
  }, [processAnalysis]);


  const resetState = (fullReset = true) => {
    if (fullReset && imagePreviewUrl && imagePreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    if (fullReset) {
      setImagePreviewUrl(null);
    }
    setStatus('idle');
    setResult(null);
    setError(null);
    window.speechSynthesis.cancel();
  };
  
  const triggerFileInput = (captureMode?: 'user' | 'environment') => {
    if (fileInputRef.current) {
        if(captureMode) {
            fileInputRef.current.setAttribute('capture', captureMode);
        } else {
            fileInputRef.current.removeAttribute('capture');
        }
      fileInputRef.current.click();
    }
  };

  const handleCameraButtonClick = (captureMode: 'user' | 'environment') => {
    // A simple check for mobile devices. The 'capture' attribute is mainly for mobile.
    const isMobile = /Mobi/i.test(window.navigator.userAgent);
    if (isMobile) {
      triggerFileInput(captureMode);
    } else {
      setIsCameraOpen(true);
    }
  };


  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 shadow-2xl w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageChange}
      />
      <CameraCapture 
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={handleCameraCapture}
      />

      {status === 'idle' && (
        <div className="flex flex-col gap-4">
          <button onClick={() => handleCameraButtonClick('environment')} className="w-full flex items-center justify-center gap-3 bg-blue-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-blue-500 transition-colors text-lg">
            <CameraIcon className="w-7 h-7" />
            Use Rear Camera
          </button>
          <button onClick={() => handleCameraButtonClick('user')} className="w-full flex items-center justify-center gap-3 bg-sky-600 text-white font-bold py-4 px-4 rounded-lg hover:bg-sky-500 transition-colors text-lg">
            <CameraFlipIcon className="w-7 h-7" />
            Use Front Camera
          </button>
          <div className="flex items-center my-2">
            <div className="flex-grow border-t border-gray-600"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-600"></div>
          </div>
          <button onClick={() => triggerFileInput()} className="w-full flex items-center justify-center gap-3 bg-gray-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-500 transition-colors text-md">
            <UploadIcon className="w-6 h-6" />
            Upload from Library
          </button>
        </div>
      )}

      {imagePreviewUrl && status !== 'idle' && (
        <div className="mb-4">
          <img src={imagePreviewUrl} alt="Selected preview" className="w-full rounded-lg shadow-lg max-h-[60vh] object-contain" />
        </div>
      )}

      {status === 'processing' && (
        <div className="text-center flex flex-col items-center gap-4">
          <Loader />
          <p className="text-lg font-medium text-gray-300">AI is thinking...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-center">
            <p className="font-bold">Analysis Failed</p>
            <p className="text-sm my-2">{error}</p>
            <button onClick={() => resetState(true)} className="bg-red-700 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-md text-sm mt-2">Try Again</button>
        </div>
      )}

      {status === 'success' && result && (
        <div>
          <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center gap-2"><SparklesIcon className="w-5 h-5" /> AI says:</h3>
                <button onClick={() => speak(result.description)} title="Read description" className="text-blue-400 hover:text-blue-300 transition-colors p-1">
                    <SpeakerIcon className="w-6 h-6" />
                </button>
            </div>
            <p className="text-lg text-gray-200">{result.description}</p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-green-400 mb-3">Keywords to learn:</h3>
            <div className="flex flex-wrap gap-4">
              {result.keywords.map((word, index) => (
                <div key={index} className="text-center">
                    <button 
                        onClick={() => speak(word)} 
                        className="bg-gray-700 text-gray-200 text-md font-medium px-4 py-2 rounded-full transition-colors hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        aria-label={`Pronounce ${word}`}
                    >
                        {word}
                    </button>
                    {result.phonetics?.[word] && (
                        <p className="text-xs text-gray-400 mt-1">
                            {result.phonetics[word]}
                        </p>
                    )}
                </div>
              ))}
            </div>
          </div>
          
          <button onClick={() => resetState(true)} className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity">
            <RefreshIcon className="w-6 h-6" />
            Analyze Another Image
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageAnalyzer;