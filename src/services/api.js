import { getContractByAddress, getContracts } from '../contracts/registry';
import axios from 'axios';
import { extractAlexandriaMetadata, isAlexandriaBook } from '../utils/alexandriaUtils';

// API base URL - from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagedao-hub-serverless-api.netlify.app';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to get a representative token ID for a collection
const getRepresentativeTokenId = async (contractAddr, chain, assetType) => {
  try {
    // For now, we'll use token ID 1 as a representative
    // In a production app, you might want to cache known token IDs
    return "1";
  } catch (error) {
    console.warn(`Could not determine a token ID for ${contractAddr}, using "1" as default`);
    return "1";
  }
};

// Collections API
// In src/services/api.js - Update the fetchCollections function

export const fetchCollections = async (chain = 'all', limit = 12) => {
  try {
    // Get contracts from registry
    const contracts = getContracts(chain);
    
    if (contracts.length === 0) {
      console.warn(`No contracts found for chain: ${chain}`);
      return { data: { items: [] } };
    }
    
    console.log(`Fetching ${contracts.length} collections for chain: ${chain}`);
    
    // Fetch a representative NFT for each collection to get collection data
    const collectionsPromises = contracts.slice(0, limit).map(async (contract) => {
      try {
        // Special handling for Alexandria books
        if (isAlexandriaBook({ chain: contract.chain, contractAddress: contract.address })) {
          const url = `/.netlify/functions/nft/${contract.address}/${contract.chain}/1?assetType=alexandria_book`;
          console.log(`Fetching Alexandria book data from: ${url}`);
          
          const response = await api.get(url);
          const bookData = response.data;
          
          // Use our utility to extract Alexandria metadata
          const alexandriaMetadata = extractAlexandriaMetadata(bookData);
          
          // Return the collection with properly formatted metadata
          return {
            contractAddress: contract.address,
            chain: contract.chain,
            title: alexandriaMetadata.title, // Use the extracted title
            name: alexandriaMetadata.title || contract.name,
            description: alexandriaMetadata.description,
            type: 'alexandria_book',
            imageURI: alexandriaMetadata.imageUrl,
            contentURI: alexandriaMetadata.readingUrl,
            totalSupply: bookData.totalSupply || 1,
            creator: alexandriaMetadata.author,
            format: 'Digital Book',
            additionalData: {
              author: alexandriaMetadata.author,
              publisher: alexandriaMetadata.publisher,
              pageCount: alexandriaMetadata.pageCount,
              language: alexandriaMetadata.language,
              publicationDate: alexandriaMetadata.publicationDate,
              exoplanet: alexandriaMetadata.exoplanet
            }
          };
        }
        
        // Skip known problematic contracts
        if (contract.address === "0x1234567890abcdef1234567890abcdef" && contract.chain === "polygon") {
          console.log(`Skipping problematic contract: ${contract.address} on ${contract.chain}`);
          // Return basic info without making API call
          return {
            contractAddress: contract.address,
            chain: contract.chain,
            name: contract.name || "Polygon Book Collection",
            type: contract.type,
            description: "Contract data currently unavailable",
            imageURI: "/images/placeholder-cover.png"
          };
        }
        
        // Get a representative token ID
        const tokenId = await getRepresentativeTokenId(contract.address, contract.chain, contract.type);
        
        // Fetch metadata for the representative token
        const url = `/.netlify/functions/nft/${contract.address}/${contract.chain}/${tokenId}?assetType=${contract.type}`;
        console.log(`Fetching collection data from: ${url}`);
        
        const response = await api.get(url);
        const nftData = response.data;
        
        // Transform NFT data into expected collection format
        return {
          contractAddress: contract.address,
          chain: contract.chain,
          name: nftData.title || contract.name,
          description: nftData.description || "",
          type: contract.type,
          imageURI: nftData.imageURI || "",
          totalSupply: nftData.totalSupply,
          maxSupply: nftData.maxSupply,
          creator: nftData.creator
        };
      } catch (error) {
        console.warn(`Error fetching data for ${contract.address} on ${contract.chain}:`, error);
        // Return basic info if API call fails
        return {
          contractAddress: contract.address,
          chain: contract.chain,
          name: contract.name || "Unknown Collection",
          type: contract.type,
          description: "Unable to fetch collection data"
        };
      }
    });
    
    let collections = await Promise.all(collectionsPromises);
    collections = collections.filter(Boolean); // Remove any nulls
    
    console.log(`Successfully fetched ${collections.length} collections`);
    
    return {
      data: {
        items: collections
      }
    };
  } catch (error) {
    console.error('Error details:', error.response || error);
    throw error;
  }
};

export const fetchCollectionTokenBatch = async (address, chain, tokenIds = [], options = {}) => {
  try {
    if (!address || !chain || !tokenIds.length) {
      throw new Error('Missing required parameters for batch fetch');
    }
    
    // Get contract details from registry
    const contract = getContractByAddress(address, chain) || {
      address,
      chain,
      type: 'book' // Default type if not found in registry
    };
    
    // Prepare query params
    const assetType = options.assetType || contract.type || 'book';
    const includeOwnership = options.includeOwnership ? 'true' : 'false';
    
    console.log(`Fetching batch with assetType: ${assetType} for ${tokenIds.length} tokens`);
    
    // Call the batch endpoint
    const batchUrl = `/.netlify/functions/nft/batch/${address}/${chain}?assetType=${assetType}&tokenIds=${tokenIds.join(',')}&includeOwnership=${includeOwnership}`;
    console.log(`Batch URL: ${batchUrl}`);
    
    const response = await api.get(batchUrl);
    console.log("Full batch response:", response.data);
    
    // Extract items from the response, handling the nested structure
    let items = [];
    if (response.data && response.data.success) {
      if (response.data.data && response.data.data.items) {
        items = response.data.data.items;
      } else if (Array.isArray(response.data.data)) {
        items = response.data.data;
      }
    }
    
    // If we didn't get any items, there might be an issue with the token IDs
    if (items.length === 0) {
      console.log("No items found in batch response. The token IDs might not exist or the contract may have a different structure.");
      
      // We could try a different range of token IDs here, but it's difficult to guess
      // without knowing the contract's implementation details
    }
    
    return {
      items: items,
      originalResponse: response.data
    };
  } catch (error) {
    console.error('Error fetching token batch:', error);
    throw error;
  }
};

// And add this function for collection info
export const fetchCollectionInfo = async (address, chain, assetType) => {
  try {
    // If chain is not provided, try to find it in the registry
    if (!chain) {
      const contract = getContractByAddress(address);
      if (contract) {
        chain = contract.chain;
      } else {
        chain = 'ethereum'; // Default to ethereum if not found
      }
    }
    
    // Get contract details from registry
    const contract = getContractByAddress(address, chain) || {
      address,
      chain,
      type: assetType || 'nft' // Use provided assetType or default to nft
    };
    
    // Call the collection-info endpoint
    const collectionUrl = `/.netlify/functions/nft/${address}/${chain}/collection-info?assetType=${assetType || contract.type}`;
    const response = await api.get(collectionUrl);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching collection info:', error);
    throw error;
  }
};

// Update the fetchCollectionDetail function to handle timeouts better
export const fetchCollectionDetail = async (address, chain, page = 1, pageSize = 20) => {
  try {
    // If chain is not provided, try to find it in the registry
    if (!chain) {
      const contract = getContractByAddress(address);
      if (contract) {
        chain = contract.chain;
      } else {
        chain = 'ethereum'; // Default to ethereum if not found
      }
    }
    
    // Get contract from registry to ensure we have the type
    const contractInfo = getContractByAddress(address, chain);
    const assetType = contractInfo?.type || 'book'; // Default to 'book' if not found
    
    console.log(`Fetching collection with address: ${address}, chain: ${chain}, assetType: ${assetType}`);
    
    // Step 1: Get collection info
    const collectionData = await fetchCollectionInfo(address, chain);
    console.log("Collection info response:", collectionData);
    
    // Create a collection object, ensuring assetType is set
    const collection = {
      contractAddress: address,
      chain: chain,
      name: collectionData.name || contractInfo?.name || "Unknown Collection",
      description: collectionData.description || contractInfo?.description || "",
      type: assetType, // Use the type from our registry
      imageURI: collectionData.imageURI || "",
      totalSupply: collectionData.totalSupply,
      maxSupply: collectionData.maxSupply,
      creator: collectionData.creator,
      format: collectionData.format
    };
    
    // Step 2: Calculate token IDs for this page
    const startTokenId = (page - 1) * pageSize + 1; // Start at token ID 1
    const endTokenId = startTokenId + pageSize - 1;
    const totalItems = collection.totalSupply || 100; // Default to 100 if unknown
    
    // Generate array of token IDs to fetch
    const tokenIds = [];
    for (let id = startTokenId; id <= endTokenId; id++) {
      if (id <= totalItems) {
        tokenIds.push(id.toString());
      }
    }
    
    console.log(`Attempting to fetch tokens with IDs: ${tokenIds.join(', ')}`);
    
    // Step 3: Fetch the batch of tokens - explicitly pass assetType
    let items = [];
    if (tokenIds.length > 0) {
      try {
        const batchResult = await fetchCollectionTokenBatch(address, chain, tokenIds, {
          assetType: assetType  // Use our preserved assetType
        });
        console.log("Extracted items:", batchResult.items);
        
        items = batchResult.items || [];
        
        // If we still don't have items, we could try a different range of token IDs
        if (items.length === 0 && totalItems > 0) {
          console.log("Trying alternative token ID range...");
          
          // Some contracts start at 0, others have a different numbering scheme
          // Try a few different possibilities
          const alternativeTokenIds = ['0']; // Try token ID 0
          
          // You could also try random IDs within the totalSupply range
          if (totalItems > 10) {
            for (let i = 0; i < 3; i++) {
              const randomId = Math.floor(Math.random() * totalItems) + 1;
              alternativeTokenIds.push(randomId.toString());
            }
          }
          
          console.log(`Trying alternative token IDs: ${alternativeTokenIds.join(', ')}`);
          
          const altBatchResult = await fetchCollectionTokenBatch(address, chain, alternativeTokenIds, {
            assetType: assetType
          });
          
          if (altBatchResult.items && altBatchResult.items.length > 0) {
            items = altBatchResult.items;
            console.log(`Found ${items.length} items with alternative token IDs`);
          }
        }
      } catch (error) {
        console.error("Error during batch fetch:", error);
      }
    }
    
    console.log(`Found ${items.length} items for collection`);
    
    // Return the combined result with pagination info
    return {
      data: {
        collection,
        items,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalItems,
          totalPages: Math.ceil(totalItems / pageSize),
          hasNextPage: page * pageSize < totalItems,
          hasPrevPage: page > 1
        }
      }
    };
  } catch (error) {
    console.error('Error fetching collection detail:', error);
    throw error;
  }
};

// Books API functions (simplified to work with our new API)
export const fetchBooks = async (limit = 12) => {
  try {
    // Get book contracts from registry
    const bookContracts = getContracts('all').filter(c => 
      c.type === 'book' || 
      c.type === 'alexandria_book' || 
      c.type === 'polygon_book'
    );
    
    if (bookContracts.length === 0) {
      console.warn('No book contracts found in registry');
      return { data: { items: [] } };
    }
    
    // Reuse our collections function but with book-specific filtering
    const booksResponse = await fetchCollections('all', limit);
    const allCollections = booksResponse.data.items;
    
    // Filter to only include book collections
    const bookCollections = allCollections.filter(c => 
      c.type === 'book' || 
      c.type === 'alexandria_book' || 
      c.type === 'polygon_book'
    );
    
    return {
      data: {
        items: bookCollections
      }
    };
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export const fetchFeaturedBooks = async (limit = 4) => {
  try {
    // Simply reuse books function but with smaller limit for featured books
    const booksResponse = await fetchBooks(limit);
    return booksResponse;
  } catch (error) {
    console.error('Error fetching featured books:', error);
    throw error;
  }
};

// Token prices API 
export const fetchTokenPrices = async () => {
  try {
    const response = await api.get('/.netlify/functions/token-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
};

// Historical data API
export const fetchHistoricalData = async (chain = 'all', period = '24h') => {
  try {
    const response = await api.get('/.netlify/functions/historical-data', {
      params: { chain, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

// Network comparison API (stub - this would need to be implemented in your API)
export const fetchNetworkComparison = async () => {
  try {
    // We don't have a direct endpoint for this, so we'll create a mock response
    // based on the token prices data
    const pricesResponse = await fetchTokenPrices();
    
    // Create a derived network comparison from the prices data
    const networks = Object.keys(pricesResponse.data || {})
      .filter(key => key !== 'updated')
      .map(chain => {
        const data = pricesResponse.data[chain];
        return {
          chain,
          price: data.price || 0,
          volume24h: data.volume24h || 0,
          liquidity: data.liquidity || 0,
          change24h: data.change24h || 0
        };
      });
    
    return {
      data: networks,
      success: true
    };
  } catch (error) {
    console.error('Error creating network comparison:', error);
    throw error;
  }
};

// NFT tracking API - modified to use registry
export const initializeTracking = async () => {
  try {
    // Get all contracts from registry
    const allContracts = getContracts('all');
    
    console.log(`Initializing tracking for ${allContracts.length} contracts`);
    
    // Our new API doesn't have a registration endpoint, so we'll just 
    // return contract information with a success flag
    return allContracts.map(contract => ({
      ...contract,
      result: {
        success: true,
        message: `Tracking initialized for ${contract.address} on ${contract.chain}`
      }
    }));
  } catch (error) {
    console.error('Error initializing tracking for contracts:', error);
    throw error;
  }
};

// Add this new function to src/services/api.js

export const fetchBookBatch = async (contractAddress, chain, tokenIds = [], includeOwnership = true) => {
  try {
    const assetType = getAssetTypeForChain(chain);
    const tokenIdsParam = Array.isArray(tokenIds) ? tokenIds.join(',') : tokenIds;
    
    const response = await api.get(`/.netlify/functions/nft/batch/${contractAddress}/${chain}`, {
      params: {
        assetType,
        tokenIds: tokenIdsParam,
        includeOwnership
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching book batch:', error);
    throw error;
  }
};

// Helper function to determine asset type based on chain
function getAssetTypeForChain(chain) {
  const types = {
    'base': 'alexandria_book',
    'ethereum': 'mirror_publication',
    'zora': 'zora_nft',
    'polygon': 'book', // Based on your API example
    'optimism': 'book'
  };
  
  return types[chain] || 'book';
}

// Update the existing fetchBookDetail function to use the batch endpoint for single books
export const fetchBookDetail = async (address, chain, tokenId) => {
  try {
    // Get contract details from registry
    const contract = getContractByAddress(address, chain) || {
      address,
      chain,
      type: 'nft' // Default type if not found in registry
    };
    
    // Call the API to get book metadata
    const url = `/.netlify/functions/nft/${address}/${chain}/${tokenId}?assetType=${contract.type}`;
    console.log(`Fetching book data from: ${url}`);
    
    const response = await api.get(url);
    
    // Check if the response has a nested data structure
    let bookData = response.data;
    
    // If response has a nested data property, use that as our book data
    if (bookData.success && bookData.data) {
      console.log('Response has nested data structure, extracting data property');
      bookData = bookData.data;
    }
    
    // Log the full structure to see what we're working with
    console.log('Book data structure before processing:', JSON.stringify(bookData, null, 2).substring(0, 500) + '...');
    
    // Look for content URIs in various places and standardize to contentURI
    const urlFieldsToCheck = [
      'contentURI', 'content_uri', 'contentUrl', 'content_url', 
      'fileURI', 'file_uri', 'fileUrl', 'file_url',
      'interactive_url', 'animation_url', 'external_url',
      'uri', 'url', 'externalUrl'
    ];
    
    // Check top-level fields
    for (const field of urlFieldsToCheck) {
      if (bookData[field] && !bookData.contentURI) {
        bookData.contentURI = bookData[field];
        console.log(`Found content URL in field '${field}', set to contentURI:`, bookData.contentURI);
      }
    }
    
    // If we have raw metadata as string, try to parse it
    if (bookData.metadata && typeof bookData.metadata === 'string') {
      try {
        bookData.metadata = JSON.parse(bookData.metadata);
        console.log('Parsed string metadata into object');
      } catch (e) {
        console.log('Failed to parse metadata string:', e);
      }
    }
    
    // Check metadata fields
    if (bookData.metadata && typeof bookData.metadata === 'object') {
      for (const field of urlFieldsToCheck) {
        if (bookData.metadata[field] && !bookData.contentURI) {
          bookData.contentURI = bookData.metadata[field];
          console.log(`Found content URL in metadata.${field}, set to contentURI:`, bookData.contentURI);
        }
      }
      
      // Check for content in properties
      if (bookData.metadata.properties) {
        // Some NFTs store content in properties.files.uri or similar
        if (bookData.metadata.properties.files) {
          const files = Array.isArray(bookData.metadata.properties.files) 
            ? bookData.metadata.properties.files 
            : [bookData.metadata.properties.files];
          
          for (const file of files) {
            if (file.uri && !bookData.contentURI) {
              bookData.contentURI = file.uri;
              console.log('Found content URL in properties.files.uri:', bookData.contentURI);
              break;
            }
          }
        }
        
        // Direct property fields
        for (const field of urlFieldsToCheck) {
          if (bookData.metadata.properties[field] && !bookData.contentURI) {
            bookData.contentURI = bookData.metadata.properties[field];
            console.log(`Found content URL in metadata.properties.${field}:`, bookData.contentURI);
          }
        }
      }
    }
    
    // Last resort - check for URLs in the description
    if (!bookData.contentURI && bookData.description) {
      // Look for http/https/ipfs links in the description
      const urlRegex = /(https?:\/\/[^\s]+)|(ipfs:\/\/[^\s]+)|(ipfs\.io\/ipfs\/[^\s]+)/g;
      const matches = [...bookData.description.matchAll(urlRegex)];
      
      if (matches.length > 0) {
        bookData.contentURI = matches[0][0];
        console.log('Extracted URL from description:', bookData.contentURI);
      }
    }
    
    console.log('Processed book data:', bookData);
    return bookData;
  } catch (error) {
    console.error('Error fetching book detail:', error);
    throw error;
  }
};
