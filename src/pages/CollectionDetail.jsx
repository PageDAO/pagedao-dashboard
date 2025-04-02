// src/pages/CollectionDetail.jsx - Updated for new API
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
  let isMounted = true;
  
  const fetchData = async () => {
    if (!isMounted) return;
    
    try {
      setLoading(true);
      const response = await fetchCollectionDetail(address, chain);
      
      if (isMounted) {
        // Log for debugging
        console.log('Collection detail response:', response);
        
        setCollection(response.data.collection);
        setItems(response.data.items || []);
        setLoading(false);
      }
    } catch (err) {
      if (isMounted) {
        console.error('Error fetching collection detail:', err);
        setError(err.message || 'Failed to fetch collection');
        setLoading(false);
      }
    }
  };
  
  fetchData();
  
  return () => {
    isMounted = false;
  };
}, [address, chain]); 
  
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
      
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Publication Details
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collection.creator && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Creator</h3>
              <p className="text-gray-800 dark:text-white break-all">
                {collection.creator}
              </p>
            </div>
          )}
          
          {collection.format && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</h3>
              <p className="text-gray-800 dark:text-white">{collection.format}</p>
            </div>
          )}
          
          {collection.totalSupply !== undefined && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Supply</h3>
              <p className="text-gray-800 dark:text-white">{collection.totalSupply}</p>
            </div>
          )}
          
          {collection.additionalData?.publisher && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Publisher</h3>
              <p className="text-gray-800 dark:text-white">{collection.additionalData.publisher}</p>
            </div>
          )}
          
          {collection.additionalData?.author && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Author</h3>
              <p className="text-gray-800 dark:text-white">{collection.additionalData.author}</p>
            </div>
          )}
          
          {/* Add more fields based on what's available in additionalData */}
        </div>
        
        {collection.contentURI && (
          <div className="mt-6">
            <a 
              href={collection.contentURI}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              View Content
            </a>
          </div>
        )}
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
              key={item.id || item.tokenId} 
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
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Using PageDAO API to fetch on-chain NFT data</p>
      </div>
    </div>
  );
}

export default CollectionDetail;
