// src/pages/CollectionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchCollectionDetail } from '../services/api';

function CollectionDetail() {
  const { address } = useParams();
  const [searchParams] = useSearchParams();
  const chain = searchParams.get('chain') || 'all';
  
  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchCollectionDetail(address, chain);
        setCollection(response.data.collection);
        setItems(response.data.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collection detail:', err);
        setError(err.message || 'Failed to fetch collection');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [address, chain]);
  
  // Chain-specific styling
  const getChainColor = (chainName) => {
    const colors = {
      ethereum: '#6F7CBA',
      optimism: '#FF0420',
      base: '#0052FF',
      zora: '#5E12A0',
      polygon: '#8247E5'
    };
    return colors[chainName] || '#4dabf7';
  };
  
  // Get collection type based on type or chain
  const getCollectionType = () => {
    if (!collection) return '';
    if (collection.type === 'alexandria_book' || collection.chain === 'base') return 'Alexandria Book';
    if (collection.type === 'mirror_publication') return 'Mirror Publication';
    if (collection.type === 'zora_nft' || collection.chain === 'zora') return 'Zora NFT';
    if (collection.type === 'readme_book' || collection.chain === 'polygon') return 'Readme Book';
    return 'NFT Collection';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  if (!collection) {
    return (
      <div className="text-center text-gray-500 py-8">
        Collection not found.
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <Link to="/collections" className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Collections
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
            <img 
              src={collection.imageURI || '/images/placeholder-cover.png'} 
              alt={collection.name} 
              className="w-full h-auto rounded-lg shadow-md"
              onError={(e) => {
                e.target.src = '/images/placeholder-cover.png';
              }}
            />
          </div>
          
          <div className="md:w-2/3">
            <div className="flex flex-wrap items-center mb-4">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white mr-3">
                {collection.name}
              </h1>
              <span 
                className="px-2 py-1 text-xs font-semibold rounded text-white"
                style={{ backgroundColor: getChainColor(collection.chain) }}
              >
                {collection.chain.charAt(0).toUpperCase() + collection.chain.slice(1)}
              </span>
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                {getCollectionType()}
              </span>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-300">
                {collection.description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Supply
                </div>
                <div className="text-xl font-semibold">
                  {collection.totalSupply || 'Unknown'}
                </div>
              </div>
              
              {collection.maxSupply && (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Max Supply
                  </div>
                  <div className="text-xl font-semibold">
                    {collection.maxSupply}
                  </div>
                </div>
              )}
              
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Creator
                </div>
                <div className="text-xl font-semibold truncate">
                  {collection.creator 
                    ? `${collection.creator.substring(0, 6)}...${collection.creator.substring(collection.creator.length - 4)}`
                    : 'Unknown'}
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Contract Information</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded font-mono text-sm break-all">
                {collection.contractAddress}
              </div>
            </div>
            
            {collection.symbol && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Symbol: {collection.symbol}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Collection Items</h2>
      
      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          No items found for this collection.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
              key={item.id} 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <img 
                src={item.imageURI || '/images/placeholder-item.png'} 
                alt={item.title || `Item #${item.tokenId}`} 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = '/images/placeholder-item.png';
                }}
              />
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                  {item.title || `Item #${item.tokenId}`}
                </h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-300 h-10 overflow-hidden">
                  {item.description?.substring(0, 60)}
                  {item.description?.length > 60 ? '...' : ''}
                </p>
                
                <div className="flex justify-between items-center mt-2">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Token ID: {item.tokenId}
                  </div>
                  {item.contentURI && (
                    <a 
                      href={item.contentURI} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 text-xs hover:text-blue-700"
                    >
                      View Content
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CollectionDetail;