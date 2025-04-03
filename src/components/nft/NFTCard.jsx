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
    if (collection.type === 'alexandria_book' || collection.chain === 'base') return 'Alexandria Book';
    if (collection.type === 'mirror_publication') return 'Mirror Publication';
    if (collection.type === 'zora_nft' || collection.chain === 'zora') return 'Zora NFT';
    if (collection.type === 'readme_book' || collection.chain === 'polygon') return 'Readme Book';
    return 'NFT Collection';
  };
  
  // Handle when collection data is incomplete
  if (!collection) {
    return null;
  }
  
  // Make sure we have a valid contract address and chain
  const hasValidLink = collection.contractAddress && collection.chain;
  
  // Create the card content (will be used inside or outside of Link)
  const cardContent = (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="relative pb-[100%]">
        <img 
          src={collection.imageURI || '/images/placeholder-cover.png'} 
          alt={collection.title || 'Collection'} 
          className="absolute w-full h-full object-cover"
          onError={(e) => { e.target.src = '/images/placeholder-cover.png' }}
        />
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
          {collection.title || collection.name || 'Untitled Collection'}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {collection.format && `Format: ${collection.format}`}
        </p>
        {/* Add additional metadata fields as needed */}
        {collection.additionalData?.author && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            By: {collection.additionalData.author}
          </p>
        )}
        {/* View details link or info */}
        <div className="mt-3 flex items-center text-sm">
          {hasValidLink ? (
            <span className="text-blue-500 hover:text-blue-700">
              View details
              <svg className="ml-1 inline w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              </svg>
            </span>
          ) : (
            <span className="text-gray-400">
              Details unavailable
            </span>
          )}
        </div>
      </div>
    </div>
  );
  
  // Wrap in Link if we have valid data, otherwise just return the card
  return hasValidLink ? (
    <Link to={`/collections/${collection.contractAddress}?chain=${collection.chain}`}>
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
}

export default NFTCard;
