import React, { useState, useEffect, useRef } from 'react';

const ReadmePopup = ({ url, onClose }) => {
  const popupRef = useRef(null);
  const iframeRef = useRef(null);
  const [iframeError, setIframeError] = useState(false);
  
  // Log the URL for debugging
  useEffect(() => {
    console.log('ReadmePopup URL:', url);
  }, [url]);
  
  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    // Disable scrolling on the main page
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);
  
  // Handle escape key to close
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscKey);
    
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);
  
  // Handle fullscreen button click
  const handleFullscreen = () => {
    try {
      if (iframeRef.current) {
        if (iframeRef.current.requestFullscreen) {
          iframeRef.current.requestFullscreen();
        } else if (iframeRef.current.mozRequestFullScreen) { /* Firefox */
          iframeRef.current.mozRequestFullScreen();
        } else if (iframeRef.current.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
          iframeRef.current.webkitRequestFullscreen();
        } else if (iframeRef.current.msRequestFullscreen) { /* IE/Edge */
          iframeRef.current.msRequestFullscreen();
        }
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
      // If fullscreen fails, open in a new tab
      window.open(url, '_blank');
    }
  };
  
  if (!url) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
        <div 
          ref={popupRef}
          className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl p-6 max-w-md"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">Error</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <p className="text-gray-700 dark:text-gray-300">
            No readable content URL found for this book.
          </p>
          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  // Ensure the URL is properly formatted
  const formattedUrl = (() => {
    if (!url) return '';
    
    // If it's already a valid URL, use it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    // If it's an IPFS URL without the protocol
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }
    
    // If it's just an IPFS hash
    if (url.match(/^Qm[1-9A-Za-z]{44}$/)) {
      return `https://ipfs.io/ipfs/${url}`;
    }
    
    // If it contains ipfs.io but doesn't have a protocol
    if (url.includes('ipfs.io') && !url.startsWith('http')) {
      return `https://${url}`;
    }
    
    // Default: assume it needs https://
    return `https://${url}`;
  })();
  
  console.log('Formatted URL for iframe:', formattedUrl);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div 
        ref={popupRef}
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl w-11/12 h-5/6 max-w-6xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">
            Readme Book Reader
          </h2>
          <div className="flex items-center">
            {/* Fullscreen button */}
            <button 
              onClick={handleFullscreen}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              title="Fullscreen"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"></path>
              </svg>
            </button>
            
            {/* Open in new tab button */}
            <a 
              href={formattedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mr-4"
              title="Open in new tab"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
            
            {/* Close button */}
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-grow overflow-hidden">
          <iframe 
            ref={iframeRef}
            src={formattedUrl} 
            title="Interactive Content"
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-top-navigation"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen={true}
            onError={() => setIframeError(true)}
          />
          
          {iframeError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white dark:bg-gray-900 p-6">
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                The content couldn't be displayed in the embedded viewer.
              </p>
              <a 
                href={formattedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open Content in New Tab
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReadmePopup;
