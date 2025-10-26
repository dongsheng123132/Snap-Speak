import React from 'react';
import ImageAnalyzer from './components/ImageAnalyzer';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-between p-4 font-sans">
      <header className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">
          Snap & Speak
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Learn language from your world.
        </p>
      </header>
      
      <main className="w-full max-w-md my-8">
        <ImageAnalyzer />
      </main>
      
      <footer className="w-full max-w-md text-center text-gray-500 text-sm">
        <p>Powered by Chrome's built-in AI. Your images are processed locally and never leave your device.</p>
      </footer>
    </div>
  );
};

export default App;