// src/components/nft/NFTCard.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const NFTCard = ({ collection }) => {
  const [imageError, setImageError] = useState(false);
  
  // Get chain color for visual indicators
  const getChainColor = (chain) => {
    const colors = {
      ethereum: '#6F7CBA',
      optimism: '#FF0420',
      base: '#0052FF',
      polygon: '#8247E5',
      zora: '#5E12A0'
    };
    return colors[chain] || '#4dabf7';
  };
  
  // Get collection type label
  const getCollectionType = () => {
    if (!collection) return '';
    if (collection.type === 'alexandria_book' || collection.chain === 'base') return 'Alexandria';
    if (collection.type === 'mirror_publication') return 'Mirror';
    if (collection.type === 'zora_nft' || collection.chain === 'zora') return 'Zora';
    if (collection.type === 'book' || collection.chain === 'polygon') return 'Readme';
    return 'NFT';
  };
  
  // Fallback image
  const fallbackImage = '/images/placeholder-cover.png';
  
  // Image source with fallback
  const getCardImage = () => {
    if (collection.chain === 'polygon' && 
        collection.contractAddress?.toLowerCase() === '0x931204fb8cea7f7068995dce924f0d76d571df99') {
      return '/images/ReadmeV1.png';
    }
    
    return collection.imageURI || collection.image || '/images/placeholder-cover.png';
  };
  
  // First, define a function to get the correct image source
  const getImageSource = () => {
    // Check if this is the Readme Books collection
    if (collection.chain === 'polygon' && 
        collection.contractAddress?.toLowerCase() === '0x931204fb8cea7f7068995dce924f0d76d571df99') {
      return '/images/ReadmeV1.png';
    }
    
    // Otherwise use the regular image
    return collection.imageURI || collection.image || '/images/placeholder-cover.png';
  };

  // Then define the imageSource variable
  const imageSource = getImageSource();
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
      {/* Card Header with Chain Indicator */}
      <div className="h-1" style={{ backgroundColor: getChainColor(collection.chain) }}></div>
      
      {/* Image Container - Fixed aspect ratio with proper book cover handling */}
      <Link 
        to={`/collections/${collection.contractAddress || collection.address}?chain=${collection.chain}`}
        className="block relative pt-[56.25%] bg-gray-100 dark:bg-gray-900 overflow-hidden"
      >
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img 
            src={imageSource}
            alt={collection.title || collection.name || "NFT Collection"}
            className="max-h-full max-w-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
      </Link>
      
      {/* Content Container - Flexible height */}
      <div className="p-4 flex-grow flex flex-col">
        {/* Collection Type Badge */}
        <div className="mb-2">
          <span 
            className="px-2 py-1 text-xs font-semibold rounded text-white"
            style={{ backgroundColor: getChainColor(collection.chain) }}
          >
            {getCollectionType()}
          </span>
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 overflow-hidden text-ellipsis" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {collection.title || collection.name || "Untitled Collection"}
        </h3>
        
        {/* Creator/Author */}
        {collection.creator && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
            by {collection.creator}
          </p>
        )}
        
        {/* Description - Allow it to grow but limit to 3 lines */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 overflow-hidden text-ellipsis flex-grow" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
          {collection.description || "No description available."}
        </p>
        
        {/* View Button - Always at bottom */}
        <Link 
          to={`/collections/${collection.contractAddress || collection.address}?chain=${collection.chain}`}
          className="mt-auto text-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          View Collection
        </Link>
      </div>
    </div>
  );
};

export default NFTCard;