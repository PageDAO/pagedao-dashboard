// src/components/nft/NFTCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

function NFTCard({ collection }) {
  // Chain-specific styling
  const getChainColor = (chain) => {
    const colors = {
      ethereum: '#6F7CBA',
      optimism: '#FF0420',
      base: '#0052FF',
      zora: '#5E12A0',
      polygon: '#8247E5'
    };
    return colors[chain] || '#4dabf7';
  };
  
  // Get collection type based on type or chain
  const getCollectionType = () => {
    if (!collection) return 'NFT Collection';
    
    // Check if this is on Base chain (likely Alexandria)
    if (collection.chain === 'base' || collection.type === 'alexandria_book' || collection.type === 'alexandria-book') {
      return 'Alexandria Book';
    }
    
    if (collection.type === 'mirror_publication') return 'Mirror Publication';
    if (collection.type === 'zora_nft' || collection.chain === 'zora') return 'Zora NFT';
    if (collection.type === 'book' || collection.chain === 'polygon') return 'Readme Book';
    return 'NFT Collection';
  };
  
  // Generate additional status badges or info
  const getCollectionBadge = () => {
    // Check if creator info exists
    if (collection.creator) {
      return (
        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
          by {collection.creator}
        </p>
      );
    }
    return null;
  };
  
  // Handle when collection data is incomplete
  if (!collection) {
    return null;
  }
  
  // Make sure we have a valid contract address and chain
  const hasValidLink = collection.contractAddress && collection.chain;
  
  // Content URL (handle different field names)
  const contentUrl = collection.contentURI || collection.url;
  
  // Create the card content (will be used inside or outside of Link)
  const cardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative pb-[100%]">
        <img 
          src={collection.imageURI || collection.image || '/images/placeholder-cover.png'} 
          alt={collection.title || collection.name || 'Collection'} 
          className="absolute w-full h-full object-cover"
          onError={(e) => { e.target.src = '/images/placeholder-cover.png' }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
          {collection.title || collection.name || 'Untitled Collection'}
        </h3>
        
        {getCollectionBadge()}
        
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 h-10 overflow-hidden">
          {collection.description?.substring(0, 60)}
          {collection.description?.length > 60 ? '...' : ''}
        </p>
        
        {/* Add collection type indicator */}
        <div className="mt-2">
          <span className="inline-block px-2 py-1 text-xs font-semibold rounded" 
            style={{ 
              backgroundColor: getChainColor(collection.chain),
              color: 'white' 
            }}>
            {getCollectionType()}
          </span>
        </div>
        
        {/* Links */}
        <div className="mt-3 flex flex-wrap">
          <Link 
            to={`/collections/${collection.contractAddress || collection.address}?chain=${collection.chain}`}
            className="inline-flex items-center text-sm text-blue-500 hover:text-blue-700 mr-4"
          >
            View details
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </Link>
          
          {/* Link to content if available */}
          {contentUrl && (
            <a 
              href={contentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-purple-500 hover:text-purple-700 mt-1 sm:mt-0"
            >
              Read content
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );
  
  // Wrap in Link if we have valid data, otherwise just return the card
  return hasValidLink ? (
    <Link to={`/collections/${collection.contractAddress || collection.address}?chain=${collection.chain}`}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

export default NFTCard;