import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchCollections } from '../services/api';
import NFTCard from '../components/nft/NFTCard';

function ChainCollections() {
  const { chainId } = useParams();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define featured collections by chain
  const featuredCollections = {
    base: {
      title: "Alexandria Labs",
      description: "Digital-first publisher pushing the boundaries of decentralized publishing with tools for authors to create and distribute their work while maintaining their rights and creative control.",
      contractAddress: "0x4F9e2e5e07B0Bfb7Ba4b5902A7F61a41Bd24C0b0",
      image: "/images/featured/alexandria-books.jpg"
    },
    polygon: {
      title: "Readme Books",
      description: "Community-curated literature and essays published as NFTs on Polygon, focusing on accessibility and low gas fees for publishing creative works.",
      contractAddress: "0x931204fb8cea7f7068995dce924f0d76d571df99",
      image: "/images/featured/readme-books.jpg"
    },
    ethereum: {
      title: "Origin Stories",
      description: "The original NFT book collection published on Ethereum mainnet. These pioneering works established the foundation for blockchain literature.",
      contractAddress: "0xf5C424C8c5502135ea9A22bEc42Bb98Fe93A64d9",
      image: "/images/featured/origin-stories.jpg"
    },
    zora: {
      title: "Zora Publications",
      description: "Community-led creative works hosted on Zora's platform, emphasizing creator ownership and fair compensation models.",
      contractAddress: "0xabcdef1234567890abcdef1234567890",
      image: "/images/featured/zora-publications.jpg"
    },
    optimism: {
      title: "Optimism Publications",
      description: "Web3 literature published on Optimism, featuring lower fees and faster transaction times while maintaining Ethereum security.",
      contractAddress: "0xa1b2c3d4e5f67890a1b2c3d4e5f67890",
      image: "/images/featured/optimism-publications.jpg"
    }
  };
  
  // Chain metadata
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
  
  const currentChain = chainInfo[chainId] || {
    name: chainId.charAt(0).toUpperCase() + chainId.slice(1),
    color: '#4dabf7',
    description: 'Blockchain literature collections'
  };
  
  // Featured collection for this chain
  const featured = featuredCollections[chainId];
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchCollections(chainId, 24);
        
        // Check the data structure
        const items = response.data?.items || [];
        
        setCollections(items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err.message || 'Failed to fetch collections');
        setLoading(false);
      }
    };
    
    if (chainId) {
      fetchData();
    }
  }, [chainId]);
  
  // Find featured collection in our data if it exists
  const featuredCollection = featured
    ? collections.find(c => c.contractAddress.toLowerCase() === featured.contractAddress.toLowerCase())
    : null;
  
  // Filter out the featured collection from the regular list
  const regularCollections = featuredCollection
    ? collections.filter(c => c.contractAddress.toLowerCase() !== featured.contractAddress.toLowerCase())
    : collections;
  
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
      {/* Back button and page header */}
      <div className="mb-6">
        <Link to="/collections" className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Blockchains
        </Link>
      </div>
      
      {/* Chain Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mr-4 flex-shrink-0"
            style={{ backgroundColor: currentChain.color }}
          >
            {currentChain.icon ? (
              <img src={currentChain.icon} alt={currentChain.name} className="w-8 h-8" />
            ) : (
              <span className="text-white text-2xl font-bold">
                {currentChain.name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              {currentChain.name} Literature
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {currentChain.description}
            </p>
          </div>
        </div>
      </div>
      
      {/* Featured Collection */}
      {(featuredCollection || featured) && (
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Featured Collection
          </h2>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="h-2" style={{ backgroundColor: currentChain.color }}></div>
            <div className="p-6">
              <div className="flex flex-col lg:flex-row">
                <div className="w-full lg:w-1/3 mb-6 lg:mb-0 lg:pr-6">
                  <img 
                    src={featuredCollection?.imageURI || featured.image || '/images/placeholder-cover.png'} 
                    alt={featuredCollection?.name || featured.title} 
                    className="w-full h-auto rounded-lg shadow-sm object-cover"
                    style={{ maxHeight: '320px' }}
                    onError={(e) => {
                      e.target.src = '/images/placeholder-cover.png';
                    }}
                  />
                </div>
                <div className="w-full lg:w-2/3">
                  <div className="flex flex-wrap items-center mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mr-3">
                      {featuredCollection?.name || featured.title}
                    </h3>
                    <span 
                      className="px-2 py-1 text-xs font-semibold rounded text-white mt-1"
                      style={{ backgroundColor: currentChain.color }}
                    >
                      {currentChain.name}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 text-lg">
                    {featured.description || featuredCollection?.description}
                  </p>
                  
                  {featuredCollection?.totalSupply && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Contains {featuredCollection.totalSupply} publications
                    </div>
                  )}
                  
                  {featuredCollection && (
                    <Link 
                      to={`/collections/${featuredCollection.contractAddress}?chain=${featuredCollection.chain}`}
                      className="inline-flex items-center px-5 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white"
                      style={{ backgroundColor: currentChain.color }}
                    >
                      Explore Collection
                      <svg className="ml-2 -mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                      </svg>
                    </Link>
                  )}
                  
                  {!featuredCollection && featured && (
                    <div className="mt-2 text-gray-600 dark:text-gray-400 border-l-4 border-yellow-400 pl-3 py-2 bg-yellow-50 dark:bg-gray-700 rounded">
                      This collection is defined in the registry but not yet loaded from the blockchain.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* All Collections */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          All Collections
        </h2>
        
        {regularCollections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {regularCollections.map((collection) => (
              <NFTCard 
                key={`${collection.chain}-${collection.contractAddress}`}
                collection={collection}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">No additional collections found</h3>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              {featuredCollection 
                ? "There are no other collections available for this blockchain." 
                : "No collections have been found for this blockchain."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChainCollections;