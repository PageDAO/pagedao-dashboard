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
  
  return (
    <Link 
      to={`/collections/${collection.contractAddress}?chain=${collection.chain}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
    >
      <div className="relative">
        <img 
          src={collection.imageURI || '/images/placeholder-cover.png'} 
          alt={collection.name || 'Unknown Collection'} 
          className="w-full h-48 object-cover"
          onError={(e) => {
            e.target.src = '/images/placeholder-cover.png';
          }}
        />
        <div 
          className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded text-white"
          style={{ backgroundColor: getChainColor(collection.chain) }}
        >
          {collection.chain.charAt(0).toUpperCase() + collection.chain.slice(1)}
        </div>
      </div>
      
      <div className="p-4">
        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
          {getCollectionType()}
        </div>
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
          {collection.name || 'Unnamed Collection'}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 text-sm h-10 overflow-hidden">
          {collection.description?.substring(0, 60)}
          {collection.description?.length > 60 ? '...' : ''}
        </p>
        
        <div className="flex justify-between items-center mt-3">
          <div className="text-xs text-gray-500 dark:text-gray-400">
          {collection.totalSupply ? `${collection.totalSupply} items` : '\u00A0'}
          </div>
          <div className="flex items-center">
            <span className="text-xs mr-1">View</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default NFTCard;
