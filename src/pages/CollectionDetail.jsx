// src/pages/CollectionDetail.jsx - Updated for new API
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchCollectionDetail } from '../services/api';
import { collectionContext } from '../contexts/collectionContext';

function CollectionDetail() {
  const { address } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const chain = searchParams.get('chain') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8; // Smaller page size to reduce API timeouts
  
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
      // Pass page and pageSize to API call
      const response = await fetchCollectionDetail(address, chain, page, pageSize);
      
      if (isMounted) {
        console.log('Collection detail response:', response);
        
        // Check for historical collection context
        const contextKey = `${chain}-${address.toLowerCase()}`;
        const historicalContext = collectionContext[contextKey];
        
        // Merge API data with historical context if available
        if (historicalContext) {
          setCollection({
            ...response.data.collection,
            ...historicalContext,
            // Keep contract address and chain from API
            contractAddress: response.data.collection.contractAddress,
            chain: response.data.collection.chain
          });
        } else {
          setCollection(response.data.collection);
        }
        
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
}, [address, chain, page]); 
  
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
    if (collection.type === 'book' || collection.chain === 'polygon') return 'Readme Book';
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
  
  // Pagination handlers
  const handleNextPage = () => {
    if (collection && items.length >= pageSize) {
      setSearchParams({ chain, page: (page + 1).toString() });
    }
  };
  
  const handlePrevPage = () => {
    if (page > 1) {
      setSearchParams({ chain, page: (page - 1).toString() });
    }
  };
  
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
          {collection.name || collection.title || "Publication Details"}
          {collection.chain === 'base' && (
            <span className="ml-2 px-2 py-1 text-xs font-semibold rounded text-white" 
              style={{ backgroundColor: getChainColor(collection.chain) }}>
              Alexandria Book
            </span>
          )}
        </h2>
        
        {/* Add book cover display for Alexandria books */}
        {collection.chain === 'base' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
            <div className="flex flex-col md:flex-row">
              {/* Book cover */}
              <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
                <img 
                  src={collection.imageURI || '/images/placeholder-cover.png'} 
                  alt={collection.title || 'Book cover'} 
                  className="w-full h-auto rounded-lg shadow-md"
                  onError={(e) => { e.target.src = '/images/placeholder-cover.png' }}
                />
              </div>
              
              {/* Book details */}
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                  {collection.title || collection.name}
                </h2>
                
                {collection.additionalData?.author && (
                  <p className="text-lg font-medium text-blue-700 dark:text-blue-200 mb-4">
                    by {collection.additionalData.author}
                  </p>
                )}
                
                <div className="mb-4 text-blue-700 dark:text-blue-200">
                  {collection.description && (
                    <p className="mb-4">{collection.description?.substring(0, 500)}
                      {collection.description?.length > 500 ? '...' : ''}
                    </p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {collection.additionalData?.publisher && (
                      <div>
                        <span className="font-semibold">Publisher:</span> {collection.additionalData.publisher}
                      </div>
                    )}
                    
                    {collection.additionalData?.pageCount && (
                      <div>
                        <span className="font-semibold">Pages:</span> {collection.additionalData.pageCount}
                      </div>
                    )}
                    
                    {collection.additionalData?.language && (
                      <div>
                        <span className="font-semibold">Language:</span> {collection.additionalData.language}
                      </div>
                    )}
                    
                    {collection.totalSupply && (
                      <div>
                        <span className="font-semibold">Total Editions:</span> {collection.totalSupply}
                      </div>
                    )}
                    
                    {collection.additionalData?.exoplanet && (
                      <div>
                        <span className="font-semibold">Exoplanet:</span> {collection.additionalData.exoplanet}
                      </div>
                    )}
                  </div>
                </div>
                
                {collection.contentURI && (
                  <a 
                    href={collection.contentURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Read Book
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Collection Items</h2>
      
      {collection.chain === 'base' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
            About This Alexandria Book
          </h3>
          <p className="text-blue-700 dark:text-blue-200">
            This is a digital book published on Base through Alexandria Labs. 
            Each token represents a unique edition of the same book content.
            {collection.additionalData?.editionInfo && (
              <span className="block mt-1">
                This book has {collection.additionalData.editionInfo}.
              </span>
            )}
          </p>
        </div>
      )}
      
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
                src={item.imageURI || collection.imageURI || '/images/placeholder-item.png'} 
                alt={item.title || `Item #${item.tokenId}`} 
                className="w-full h-48 object-cover"
                onError={(e) => {
                  e.target.src = '/images/placeholder-item.png';
                }}
              />
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                  {collection.chain === 'base' 
                    ? `Edition #${item.tokenId}` 
                    : (item.title || `Item #${item.tokenId}`)}
                </h3>
                
                {collection.chain !== 'base' && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 h-10 overflow-hidden">
                    {item.description?.substring(0, 60)}
                    {item.description?.length > 60 ? '...' : ''}
                  </p>
                )}
                
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
      
      {/* Pagination controls */}
      <div className="mt-8 flex justify-between items-center">
        <button
          onClick={handlePrevPage}
          disabled={page <= 1}
          className={`px-4 py-2 rounded ${page > 1 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Previous Page
        </button>
        
        <span className="text-gray-600 dark:text-gray-300">
          Page {page}
        </span>
        
        <button
          onClick={handleNextPage}
          disabled={items.length < pageSize}
          className={`px-4 py-2 rounded ${items.length >= pageSize 
            ? 'bg-blue-500 text-white hover:bg-blue-600' 
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Next Page
        </button>
      </div>
      
      <div className="mt-8 text-center text-gray-500 text-sm">
        <p>Using PageDAO API to fetch on-chain NFT data</p>
      </div>
    </div>
  );
}

export default CollectionDetail;
