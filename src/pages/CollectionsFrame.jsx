// src/pages/frames/CollectionsFrame.jsx
import React, { useState, useEffect } from 'react';
import { fetchCollections } from '../../services/api';

function CollectionsFrame() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [chain, setChain] = useState('all');
  
  const itemsPerPage = 4; // Show 4 collections at a time
  const chains = ['all', 'base', 'ethereum', 'polygon', 'zora', 'optimism'];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchCollections(chain, 20); // Fetch 20 collections max
        setCollections(response.data.items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err.message || 'Failed to fetch collections');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chain]);
  
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
  
  // Calculate page controls
  const totalPages = Math.ceil(collections.length / itemsPerPage);
  const currentItems = collections.slice(page * itemsPerPage, (page + 1) * itemsPerPage);
  const hasNextPage = page < totalPages - 1;
  const hasPrevPage = page > 0;
  
  // Navigation handlers
  const nextPage = () => {
    if (hasNextPage) setPage(page + 1);
  };
  
  const prevPage = () => {
    if (hasPrevPage) setPage(page - 1);
  };
  
  const nextChain = () => {
    const currentIndex = chains.indexOf(chain);
    const nextIndex = (currentIndex + 1) % chains.length;
    setChain(chains[nextIndex]);
    setPage(0); // Reset to first page
  };
  
  // Generate Frame meta tags
  const frameMetaTags = () => {
    return (
      <>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="https://pagedao-hub.netlify.app/api/frames/collections?chain=${chain}&page=${page}" />
        <meta property="fc:frame:button:1" content={hasPrevPage ? "Previous" : "⬅️"} />
        <meta property="fc:frame:button:2" content={`Chain: ${chain}`} />
        <meta property="fc:frame:button:3" content={hasNextPage ? "Next" : "➡️"} />
        <meta property="fc:frame:button:4" content="View on Web" />
        <meta property="fc:frame:post_url" content="https://pagedao-hub.netlify.app/api/frames/action" />
      </>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        {frameMetaTags()}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-500 font-bold">Error loading collections</div>
        <div className="text-gray-600 mt-2">{error}</div>
        {frameMetaTags()}
      </div>
    );
  }
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg">
      {frameMetaTags()}
      
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">
          PageDAO Collections
          <span 
            className="ml-2 px-2 py-1 text-xs font-semibold rounded text-white"
            style={{ backgroundColor: getChainColor(chain) }}
          >
            {chain === 'all' ? 'All Chains' : chain.charAt(0).toUpperCase() + chain.slice(1)}
          </span>
        </h2>
        <div className="text-sm text-gray-500">
          Page {page + 1} of {totalPages}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {currentItems.map((collection) => (
          <div 
            key={`${collection.chain}-${collection.contractAddress}`}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div className="relative h-24">
              <img 
                src={collection.imageURI || '/images/placeholder-cover.png'} 
                alt={collection.name} 
                className="w-full h-full object-cover"
              />
              <div 
                className="absolute top-1 right-1 px-1 py-0.5 text-xs font-semibold rounded text-white"
                style={{ backgroundColor: getChainColor(collection.chain) }}
              >
                {collection.chain.charAt(0).toUpperCase() + collection.chain.slice(1)}
              </div>
            </div>
            
            <div className="p-2">
              <h3 className="text-sm font-semibold truncate">
                {collection.name}
              </h3>
              <div className="text-xs text-gray-500 h-8 overflow-hidden">
                {collection.description?.substring(0, 40)}
                {collection.description?.length > 40 ? '...' : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-between mt-4 text-xs">
        <button 
          className={`px-2 py-1 rounded ${hasPrevPage ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}
          onClick={prevPage}
          disabled={!hasPrevPage}
        >
          Previous
        </button>
        
        <button 
          className="px-2 py-1 rounded bg-purple-500 text-white"
          onClick={nextChain}
        >
          Change Chain
        </button>
        
        <button 
          className={`px-2 py-1 rounded ${hasNextPage ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'}`}
          onClick={nextPage}
          disabled={!hasNextPage}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default CollectionsFrame;