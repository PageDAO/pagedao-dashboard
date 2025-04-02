// Updated Collections.jsx to work with the new API
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollections } from '../services/api';
import { trackedContracts } from '../config/contracts';
import NFTCard from '../components/nft/NFTCard';

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
              <li>API is running and accessible at: {import.meta.env.VITE_API_URL || 'https://pagedao-hub-serverless-api.netlify.app'}</li>
              <li>The NFT endpoint is working: <code>/.netlify/functions/nft</code></li>
              <li>Blockchain RPC connections are functioning</li>
            </ul>
          </div>
        </div>
      )}
      
      {collections.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map((collection) => (
            <NFTCard 
              key={`${collection.chain}-${collection.contractAddress}`}
              collection={collection}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Collections;
