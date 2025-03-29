// Updated Collections.jsx to include debug information
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollections } from '../services/api';
import { trackedContracts } from '../config/contracts';

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChain, setActiveChain] = useState('all');
  
  const chains = [
    { id: 'all', name: 'All Chains' },
    { id: 'base', name: 'Base', color: '#0052FF' },
    { id: 'ethereum', name: 'Ethereum', color: '#6F7CBA' },
    { id: 'polygon', name: 'Polygon', color: '#8247E5' },
    { id: 'zora', name: 'Zora', color: '#5E12A0' },
    { id: 'optimism', name: 'Optimism', color: '#FF0420' }
  ];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Fetching collections for chain: ${activeChain}`);
        const response = await fetchCollections(activeChain, 24);
        console.log('API response:', response);
        
        // Check the data structure
        const items = response.data?.items || [];
        console.log(`Found ${items.length} collections:`, items);
        
        setCollections(items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err.message || 'Failed to fetch collections');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [activeChain]);
  
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
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          PageDAO Collections
        </h1>
        
        <div className="flex flex-wrap gap-2">
          {chains.map(chain => (
            <button
              key={chain.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${activeChain === chain.id
                  ? chain.id === 'all'
                    ? 'bg-blue-500 text-white'
                    : `text-white` 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              style={activeChain === chain.id && chain.id !== 'all' ? { backgroundColor: chain.color } : {}}
              onClick={() => setActiveChain(chain.id)}
            >
              {chain.name}
            </button>
          ))}
        </div>
      </div>
      
      {collections.length === 0 && !loading && !error && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8">
          <h2 className="text-lg font-semibold mb-4">No collections found, but tracking is initialized</h2>
          <p className="mb-4">It may take some time for the indexing to complete. Here are the contracts we're tracking:</p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Chain</th>
                  <th className="px-4 py-2 text-left">Contract Address</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {trackedContracts.map((contract, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800' : 'bg-white dark:bg-gray-700'}>
                    <td className="px-4 py-2">{contract.chain}</td>
                    <td className="px-4 py-2 font-mono text-sm">{contract.address}</td>
                    <td className="px-4 py-2">{contract.type}</td>
                    <td className="px-4 py-2">{contract.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-6">
            <p>If collections don't appear after a while, try checking:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>API is running and accessible at: {import.meta.env.VITE_API_URL || 'http://localhost:8888/api'}</li>
              <li>The collections endpoint is working: <code>/collections</code></li>
              <li>Registration endpoint is working: <code>/collections/register</code></li>
              <li>Blockchain RPC connections are functioning</li>
            </ul>
          </div>
        </div>
      )}
      
      {collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <Link 
              key={`${collection.chain}-${collection.contractAddress}`}
              to={`/collections/${collection.contractAddress}?chain=${collection.chain}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition duration-300"
            >
              <div className="relative">
                <img 
                  src={collection.imageURI} 
                  alt={collection.name} 
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    // Use a data URL for a colored placeholder
                    const colors = {
                      'base': '#0052FF',
                      'ethereum': '#6F7CBA',
                      'polygon': '#8247E5',
                      'zora': '#5E12A0',
                      'optimism': '#FF0420'
                    };
                    const bgColor = colors[collection.chain] || '#4dabf7';
                    e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' width='200' height='200'%3E%3Crect width='200' height='200' fill='${bgColor.replace('#', '%23')}'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='20' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${collection.name.substring(0, 10)}%3C/text%3E%3C/svg%3E`;
                  }}
                />
                <div 
                  className="absolute top-3 right-3 px-2 py-1 text-xs font-semibold rounded text-white"
                  style={{ 
                    backgroundColor: chains.find(c => c.id === collection.chain)?.color || '#4dabf7'
                  }}
                >
                  {collection.chain.charAt(0).toUpperCase() + collection.chain.slice(1)}
                </div>
              </div>
              
              <div className="p-4">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {collection.type === 'alexandria_book' ? 'Alexandria Book' :
                   collection.type === 'mirror_publication' ? 'Mirror Publication' :
                   collection.type === 'zora_nft' ? 'Zora NFT' :
                   collection.type === 'readme_book' ? 'Readme Book' : 'NFT Collection'}
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                  {collection.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm h-10 overflow-hidden">
                  {collection.description?.substring(0, 60)}
                  {collection.description?.length > 60 ? '...' : ''}
                </p>
                
                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {collection.totalSupply ? `${collection.totalSupply} items` : '\u00A0'}
                  </div>
                  <div className="flex items-center text-blue-500">
                    <span className="text-xs mr-1">View</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Collections;