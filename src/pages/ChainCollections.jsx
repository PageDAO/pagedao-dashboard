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
      title: "Base Literature",
      description: "Digital-first literature published on the Base blockchain. Explore a variety of books and publications in this growing ecosystem.",
      contractAddress: "", 
      image: "/images/featured/base-books.jpg"
    },
    optimism: {
      title: "Builder blog posts by IPFSnut",
      description: "Community-created articles and essays published through Mirror protocol. Mirror provides decentralized publishing with built-in monetization and governance tools.",
      contractAddress: "0x8338c8e0e3e713ee2502c526f4840657be9fb350",
      image: "/images/featured/mirror-essays.jpg"  
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
        
        // Special handling for Alexandria books on Base chain
        if (chainId === 'base') {
          console.log('Processing Alexandria collections');
          
          // For each Alexandria book, ensure it has the proper metadata
          const enhancedItems = await Promise.all(items.map(async (item) => {
            // Check if this is an Alexandria book that needs title enhancement
            if (isAlexandriaBook(item) && (!item.title || item.title.includes('Collection'))) {
              try {
                console.log(`Enhancing metadata for Alexandria book: ${item.contractAddress}`);
                
                const url = `/.netlify/functions/nft/${item.contractAddress}/${item.chain}/1?assetType=alexandria_book`;
                const response = await api.get(url);
                
                const bookData = response.data;
                const alexandriaMetadata = extractAlexandriaMetadata(bookData);
                
                // Update the item with the enhanced metadata
                return {
                  ...item,
                  title: alexandriaMetadata.title || item.title,
                  name: alexandriaMetadata.title || item.name,
                  imageURI: alexandriaMetadata.imageUrl || item.imageURI,
                  contentURI: alexandriaMetadata.readingUrl || item.contentURI,
                  additionalData: {
                    ...item.additionalData,
                    author: alexandriaMetadata.author || item.additionalData?.author
                  }
                };
              } catch (err) {
                console.error(`Error enhancing Alexandria metadata for ${item.contractAddress}:`, err);
                return item;
              }
            }
            
            // Return the original item if no enhancement needed
            return item;
          }));
          
          setCollections(enhancedItems);
        } else {
          // For non-Base chains, just use the items directly
          setCollections(items);
        }
        
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
  
  // For Base chain (Alexandria), we might need to fetch token #1 to get proper book title
  useEffect(() => {
    // This code runs after collections are fetched
    if (featuredCollection && chainId === 'base' && 
        (featuredCollection.name.includes('Collection') || !featuredCollection.title)) {
      const fetchAlexandriaBookData = async () => {
        try {
          console.log('Fetching Alexandria book details for featured collection');
          
          // Directly fetch the token #1 for this collection
          const bookResponse = await fetch(
            `/.netlify/functions/nft/${featuredCollection.contractAddress}/base/1?assetType=alexandria_book`
          );
          
          if (!bookResponse.ok) {
            throw new Error(`API responded with status: ${bookResponse.status}`);
          }
          
          const bookData = await bookResponse.json();
          console.log('Alexandria book data response:', bookData);
          
          // Extract the real title from various possible locations in the response
          const metadata = bookData.metadata || bookData;
          let bookTitle = null;
          
          if (metadata.name && !metadata.name.includes('Collection')) {
            bookTitle = metadata.name.replace(/ #\d+$/, '');
          } else if (metadata.properties?.title) {
            bookTitle = metadata.properties.title;
          } else if (metadata.properties?.work) {
            bookTitle = metadata.properties.work;
          } else if (metadata.title) {
            bookTitle = metadata.title;
          }
          
          if (bookTitle) {
            console.log(`Found real Alexandria book title: ${bookTitle}`);
            
            // Update the collections array to use this title
            setCollections(prevCollections => {
              return prevCollections.map(collection => {
                if (collection.contractAddress === featuredCollection.contractAddress) {
                  return {
                    ...collection,
                    title: bookTitle,
                    name: bookTitle
                  };
                }
                return collection;
              });
            });
          }
        } catch (err) {
          console.error('Error fetching Alexandria book details:', err);
        }
      };
      
      fetchAlexandriaBookData();
    }
  }, [featuredCollection, chainId]);
  
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
                  <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-2">
                    <img 
                      src={featuredCollection?.imageURI || featured.image || '/images/placeholder-cover.png'} 
                      alt={featuredCollection?.name || featured.title} 
                      className="w-full h-auto rounded-lg object-contain"
                      style={{ maxHeight: '320px' }}
                      onError={(e) => {
                        e.target.src = '/images/placeholder-cover.png';
                      }}
                    />
                  </div>
                </div>
                <div className="w-full lg:w-2/3">
                  <div className="flex flex-wrap items-center mb-3">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mr-3">
                      {/* Prioritize the real title over the hardcoded or registry name */}
                      {featuredCollection?.title || featuredCollection?.name || featured.title}
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
              <Link 
                key={`${collection.chain}-${collection.contractAddress}`}
                to={`/collections/${collection.contractAddress}?chain=${collection.chain}`}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 p-2">
                  <img 
                    src={collection.imageURI || '/images/placeholder-cover.png'} 
                    alt={collection.name || 'Collection'} 
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.src = '/images/placeholder-cover.png';
                    }}
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1 truncate">
                    {collection.name || 'Unnamed Collection'}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 h-10 overflow-hidden">
                    {collection.description?.substring(0, 60)}
                    {collection.description?.length > 60 ? '...' : ''}
                  </p>
                </div>
              </Link>
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