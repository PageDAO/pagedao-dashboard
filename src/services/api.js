import { getContractByAddress, getContracts } from '../contracts/registry';
import axios from 'axios';

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
      type: 'nft' // Default type if not found in registry
    };
    
    // Prepare query params
    const assetType = options.assetType || contract.type;
    const includeOwnership = options.includeOwnership ? 'true' : 'false';
    
    // Call the batch endpoint
    const batchUrl = `/.netlify/functions/nft/batch/${address}/${chain}?assetType=${assetType}&tokenIds=${tokenIds.join(',')}&includeOwnership=${includeOwnership}`;
    const response = await api.get(batchUrl);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching token batch:', error);
    throw error;
  }
};

// And add this function for collection info
export const fetchCollectionInfo = async (address, chain) => {
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
      type: 'nft' // Default type if not found in registry
    };
    
    // Call the collection-info endpoint
    const collectionUrl = `/.netlify/functions/nft/${address}/${chain}/collection-info?assetType=${contract.type}`;
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
    
    // Step 1: Get collection info
    const collectionInfoUrl = `/.netlify/functions/nft/${address}/${chain}/collection-info?assetType=book`;
    console.log(`Fetching collection info from: ${collectionInfoUrl}`);
    const collectionResponse = await api.get(collectionInfoUrl);
    const collectionData = collectionResponse.data.data;
    
    // Create a collection object
    const collection = {
      contractAddress: address,
      chain: chain,
      name: collectionData.name || "Unknown Collection",
      description: collectionData.description || "",
      type: collectionData.assetType || "book",
      imageURI: collectionData.imageURI || "",
      totalSupply: collectionData.totalSupply,
      maxSupply: collectionData.maxSupply,
      creator: collectionData.creator,
      format: collectionData.format
    };
    
    // Step 2: Calculate token IDs for this page
    const startTokenId = (page - 1) * pageSize + 1;
    const endTokenId = startTokenId + pageSize - 1;
    const totalItems = collection.totalSupply || 100; // Default to 100 if unknown
    
    // Generate array of token IDs to fetch
    const tokenIds = [];
    for (let id = startTokenId; id <= endTokenId; id++) {
      if (id <= totalItems) {
        tokenIds.push(id.toString());
      }
    }
    
    // Step 3: Fetch tokens in smaller batches to avoid timeouts
    let items = [];
    if (tokenIds.length > 0) {
      // Split into smaller batches of 5 tokens each
      const batchSize = 5;
      const batches = [];
      
      for (let i = 0; i < tokenIds.length; i += batchSize) {
        batches.push(tokenIds.slice(i, i + batchSize));
      }
      
      console.log(`Fetching ${batches.length} batches of tokens`);
      
      // Process each batch with a longer timeout
      for (const batchTokens of batches) {
        try {
          const batchUrl = `/.netlify/functions/nft/batch/${address}/${chain}?assetType=${collection.type}&tokenIds=${batchTokens.join(',')}&includeOwnership=true`;
          console.log(`Fetching tokens batch from: ${batchUrl}`);
          
          // Create a special instance with longer timeout just for this request
          const batchResponse = await axios({
            method: 'get',
            url: batchUrl,
            baseURL: API_BASE_URL,
            timeout: 30000, // 30 seconds timeout for batch requests
            headers: {
              'Content-Type': 'application/json',
            }
          });
          
          // Add these items to our collection
          if (batchResponse.data?.data?.items) {
            items = [...items, ...batchResponse.data.data.items];
          }
        } catch (batchError) {
          console.warn(`Error fetching batch ${batchTokens.join(',')}: ${batchError.message}`);
          // Continue with other batches even if one fails
        }
      }
    }
    
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
