// src/pages/CollectionDetail.jsx - Updated for registry integration
import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchCollectionDetail } from '../services/api';
import { fetchRegistry } from '../services/registryApiClient';

function CollectionDetail() {
  const { address } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const chain = searchParams.get('chain') || 'all';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 8;
  
  const [collection, setCollection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define the getCollectionImage function to use ReadmeV1.png for Readme Books
  const getCollectionImage = () => {
    if (!collection) return '/images/placeholder-cover.png';
    
    // Check if this is the Readme Books collection
    if (collection.chain === 'polygon' && 
        collection.contractAddress?.toLowerCase() === '0x931204fb8cea7f7068995dce924f0d76d571df99') {
      return '/images/ReadmeV1.png';
    }
    
    // Otherwise use the regular image
    return collection.imageURI || '/images/placeholder-cover.png';
  };
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        
        // First try to get collection from registry
        let registryCollection = null;
        const registry = await fetchRegistry();
        
        // Find the collection in the registry
        if (chain && chain !== 'all' && registry[chain]) {
          registryCollection = registry[chain].find(c => 
            c.address.toLowerCase() === address.toLowerCase()
          );
        } else {
          // Search all chains if chain not specified
          for (const [chainName, collections] of Object.entries(registry)) {
            const found = collections.find(c => 
              c.address.toLowerCase() === address.toLowerCase()
            );
            if (found) {
              registryCollection = found;
              // Update the chain if found in a different chain
              if (chain === 'all') {
                setSearchParams({ chain: chainName, page: page.toString() });
              }
              break;
            }
          }
        }
        
        if (registryCollection) {
          console.log('Collection found in registry:', registryCollection);
          
          // Format registry data to match expected structure
          const formattedCollection = {
            contractAddress: registryCollection.address,
            chain: registryCollection.chain || chain,
            name: registryCollection.name,
            title: registryCollection.name,
            description: registryCollection.description || "",
            type: registryCollection.type || 'book',
            imageURI: registryCollection.image || "",
            contentURI: registryCollection.url || "",
            creator: registryCollection.creator || "",
            additionalData: {
              author: registryCollection.creator,
              publisher: registryCollection.publisher
            }
          };
          
          setCollection(formattedCollection);
          
          // Calculate token IDs for this page
          const startTokenId = (page - 1) * pageSize + 1;
          const endTokenId = startTokenId + pageSize - 1;
          
          // Generate array of token IDs to fetch
          const tokenIds = [];
          for (let id = startTokenId; id <= endTokenId; id++) {
            tokenIds.push(id.toString());
          }
          
          // Fetch actual token metadata for specific collections
          if (
            (formattedCollection.chain === 'polygon' &&
              formattedCollection.contractAddress.toLowerCase() === '0x931204fb8cea7f7068995dce924f0d76d571df99') ||
            formattedCollection.type === 'book' || 
            formattedCollection.type === 'alexandria_book'
          ) {
            try {
              // Use the batch endpoint to fetch token metadata
              const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagedao-hub-serverless-api.netlify.app';
              const batchUrl = `${API_BASE_URL}/.netlify/functions/nft/batch/${formattedCollection.contractAddress}/${formattedCollection.chain}?assetType=${formattedCollection.type || 'book'}&tokenIds=${tokenIds.join(',')}&includeMetadata=true`;
              
              console.log(`Fetching batch metadata: ${batchUrl}`);
              const response = await fetch(batchUrl);
              
              if (!response.ok) {
                throw new Error(`API responded with status: ${response.status}`);
              }
              
              const batchData = await response.json();
              console.log('Batch metadata response:', batchData);
              
              // Extract items from the response
              let fetchedItems = [];
              if (batchData.data?.items) {
                fetchedItems = batchData.data.items;
              } else if (Array.isArray(batchData.data)) {
                fetchedItems = batchData.data;
              } else if (batchData.items) {
                fetchedItems = batchData.items;
              }
              
              // Process and normalize the items
              const processedItems = fetchedItems.map(item => ({
                tokenId: item.tokenId,
                title: item.title || item.name || `${formattedCollection.name} #${item.tokenId}`,
                description: item.description || formattedCollection.description,
                imageURI: item.imageURI || item.image || formattedCollection.imageURI,
                contentURI: item.contentURI || item.animation_url || item.external_url || item.url,
                author: item.author || item.creator || formattedCollection.creator,
                metadata: item.metadata || {}
              }));
              
              setItems(processedItems);
            } catch (error) {
              console.error('Error fetching token batch:', error);
              
              // Fallback to placeholder items if metadata fetch fails
              const placeholderItems = tokenIds.map(tokenId => ({
                tokenId,
                title: `${formattedCollection.name} #${tokenId}`,
                description: formattedCollection.description,
                imageURI: formattedCollection.imageURI
              }));
              
              setItems(placeholderItems);
            }
          } else {
            // For other collections, use placeholder items
            const placeholderItems = tokenIds.map(tokenId => ({
              tokenId,
              title: `${formattedCollection.name} #${tokenId}`,
              description: formattedCollection.description,
              imageURI: formattedCollection.imageURI
            }));
            
            setItems(placeholderItems);
          }
        } else {
          // Fallback to API if not in registry
          console.log('Collection not found in registry, falling back to API');
          const response = await fetchCollectionDetail(address, chain, page, pageSize);
          
          if (isMounted) {
            setCollection(response.data.collection);
            setItems(response.data.items || []);
          }
        }
        
        if (isMounted) {
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
          <span className="ml-2 px-2 py-1 text-xs font-semibold rounded text-white" 
            style={{ backgroundColor: getChainColor(collection.chain) }}>
            {getCollectionType()}
          </span>
        </h2>
        
        {/* Collection details */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg mb-6">
          <div className="flex flex-col md:flex-row">
            {/* Cover image */}
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-6">
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden shadow-md p-4 flex items-center justify-center" style={{ height: '300px' }}>
                <img 
                  src={getCollectionImage()} 
                  alt={collection.title || 'Collection'} 
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { e.target.src = '/images/placeholder-cover.png' }}
                />
              </div>
            </div>
            
            {/* Collection details */}
            <div className="md:w-2/3">
              <h2 className="text-2xl font-bold text-blue-800 dark:text-blue-300 mb-2">
                {collection.title || collection.name}
              </h2>
              
              {collection.creator && (
                <p className="text-lg font-medium text-blue-700 dark:text-blue-200 mb-4">
                  by {collection.creator}
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
                  
                  {collection.type && (
                    <div>
                      <span className="font-semibold">Type:</span> {collection.type}
                    </div>
                  )}
                  
                  {collection.chain && (
                    <div>
                      <span className="font-semibold">Chain:</span> {collection.chain}
                    </div>
                  )}
                  
                  {collection.totalSupply && (
                    <div>
                      <span className="font-semibold">Total Editions:</span> {collection.totalSupply}
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
                  Read Content
                  <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
                  </svg>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8 mb-6">Collection Items</h2>
      
      {items.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          No items found for this collection.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <div 
            key={item.id || item.tokenId} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <Link to={`/collections/${address}/${item.tokenId}?chain=${chain}`}>
              <div className="relative h-48 bg-gray-100 dark:bg-gray-900 rounded-t-lg overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <img 
                    src={item.imageURI || collection.imageURI || '/images/placeholder-item.png'} 
                    alt={item.title || `Item #${item.tokenId}`} 
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-item.png';
                    }}
                  />
                </div>
              </div>
            </Link>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                {item.title || `Item #${item.tokenId}`}
              </h3>
              
              {item.author && (
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  by {item.author}
                </p>
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-300 h-10 overflow-hidden">
                {item.description?.substring(0, 60)}
                {item.description?.length > 60 ? '...' : ''}
              </p>
              
              <div className="flex justify-between items-center mt-3">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Token ID: {item.tokenId}
                </span>
                
                <Link 
                  to={`/collections/${address}/${item.tokenId}?chain=${chain}`}
                  className="text-blue-500 text-sm hover:text-blue-700"
                >
                  View Details
                </Link>
              </div>
              
              {item.contentURI && (
                <div className="mt-2">
                  <a 
                    href={item.contentURI} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-purple-500 hover:text-purple-700"
                  >
                    Read Content
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                    </svg>
                  </a>
                </div>
              )}
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
      <p>Powered by PageDAO Registry</p>
    </div>
  </div>
);
}

export default CollectionDetail;

