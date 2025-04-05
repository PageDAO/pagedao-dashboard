// src/pages/Collections.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchCollections } from '../services/api';
import NFTCard from '../components/nft/NFTCard';

function Collections() {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Chain metadata for display
  const chainInfo = {
    ethereum: { 
      name: 'Ethereum', 
      color: '#6F7CBA',
      description: 'The original blockchain for NFT literature and publications',
      icon: '/images/ethereum-logo.svg'
    },
    base: { 
      name: 'Base', 
      color: '#0052FF',
      description: 'Home to Alexandria Books and Web3 native publishing',
      icon: '/images/base-logo.svg'
    },
    polygon: { 
      name: 'Polygon', 
      color: '#8247E5',
      description: 'Low-cost publishing featuring Readme Books collection',
      icon: '/images/polygon-logo.svg'
    },
    optimism: { 
      name: 'Optimism', 
      color: '#FF0420',
      description: 'Emerging platform for decentralized literature',
      icon: '/images/optimism-logo.svg'
    },
    zora: { 
      name: 'Zora', 
      color: '#5E12A0',
      description: 'Community-focused publishing platform',
      icon: '/images/zora-logo.svg'
    }
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchCollections('all');
        setCollections(response.data.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err.message || 'Failed to fetch collections');
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Group collections by chain
  const collectionsByChain = collections.reduce((acc, collection) => {
    const chain = collection.chain || 'unknown';
    if (!acc[chain]) {
      acc[chain] = [];
    }
    acc[chain].push(collection);
    return acc;
  }, {});
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  // Error state
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
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Explore Collections
      </h1>
      
      {/* Featured Collections */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Featured Collections
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections
            .filter(collection => collection.featured)
            .slice(0, 4)
            .map(collection => (
              <NFTCard 
                key={`${collection.chain}-${collection.contractAddress}`}
                collection={collection}
              />
            ))}
        </div>
      </div>
      
      {/* Collections by Chain */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
          Collections by Blockchain
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.keys(chainInfo).map(chainId => (
            <Link 
              key={chainId}
              to={`/collections/chain/${chainId}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-2" style={{ backgroundColor: chainInfo[chainId].color }}></div>
              <div className="p-6">
                <div className="flex items-center">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center mr-4"
                    style={{ backgroundColor: chainInfo[chainId].color }}
                  >
                    {chainInfo[chainId].icon ? (
                      <img src={chainInfo[chainId].icon} alt={chainInfo[chainId].name} className="w-6 h-6" />
                    ) : (
                      <span className="text-white text-xl font-bold">
                        {chainInfo[chainId].name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                      {chainInfo[chainId].name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {collectionsByChain[chainId]?.length || 0} collections
                    </p>
                  </div>
                </div>
                
                <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
                  {chainInfo[chainId].description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
      
      {/* All Collections */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          All Collections
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {collections.map(collection => (
            <NFTCard 
              key={`${collection.chain}-${collection.contractAddress}`}
              collection={collection}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Collections;
