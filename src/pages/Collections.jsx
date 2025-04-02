import React from 'react';
import { Link } from 'react-router-dom';

function Collections() {
  // Define our blockchain networks
  const chains = [
    { 
      id: 'ethereum', 
      name: 'Ethereum', 
      color: '#6F7CBA',
      description: 'The original blockchain for NFT literature and publications',
      icon: '/images/ethereum-logo.svg', // Add these icon paths if you have them
      collectionsCount: 2
    },
    { 
      id: 'base', 
      name: 'Base', 
      color: '#0052FF',
      description: 'Home to Alexandria Books and Web3 native publishing',
      icon: '/images/base-logo.svg',
      collectionsCount: 1
    },
    { 
      id: 'polygon', 
      name: 'Polygon', 
      color: '#8247E5',
      description: 'Low-cost publishing featuring Readme Books collection',
      icon: '/images/polygon-logo.svg',
      collectionsCount: 1
    },
    { 
      id: 'optimism', 
      name: 'Optimism', 
      color: '#FF0420',
      description: 'Emerging platform for decentralized literature',
      icon: '/images/optimism-logo.svg',
      collectionsCount: 1
    },
    { 
      id: 'zora', 
      name: 'Zora', 
      color: '#5E12A0',
      description: 'Community-focused publishing platform',
      icon: '/images/zora-logo.svg',
      collectionsCount: 1
    }
  ];
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Onchain Literature
        </h1>
        <p className="text-gray-600 dark:text-gray-300 max-w-3xl">
          Explore digital books and publications across different blockchain networks. 
          Each chain offers unique collections with different focuses and communities.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chains.map(chain => (
          <Link 
            key={chain.id}
            to={`/collections/chain/${chain.id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
          >
            <div className="h-2" style={{ backgroundColor: chain.color }}></div>
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                  style={{ backgroundColor: chain.color }}
                >
                  {chain.icon ? (
                    <img src={chain.icon} alt={chain.name} className="w-6 h-6" />
                  ) : (
                    <span className="text-white text-xl font-bold">
                      {chain.name.charAt(0)}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {chain.name}
                </h2>
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 mb-4 h-12">
                {chain.description}
              </p>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {chain.collectionsCount} {chain.collectionsCount === 1 ? 'collection' : 'collections'}
                </span>
                <span 
                  className="inline-flex items-center text-sm font-medium"
                  style={{ color: chain.color }}
                >
                  Explore
                  <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Collections;