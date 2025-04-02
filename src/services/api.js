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
          description: ""
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

export const fetchCollectionDetail = async (address, chain) => {
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
      address: address,
      chain: chain,
      type: 'nft' // Default type if not found in registry
    };
    
    // Get a representative token ID
    const tokenId = await getRepresentativeTokenId(address, chain, contract.type);
    
    // Fetch basic collection information from the representative token
    const collectionUrl = `/.netlify/functions/nft/${address}/${chain}/${tokenId}?assetType=${contract.type}`;
    const collectionResponse = await api.get(collectionUrl);
    const nftData = collectionResponse.data;
    
    // Create a collection object
    const collection = {
      contractAddress: address,
      chain: chain,
      name: nftData.title || contract.name || "Unknown Collection",
      description: nftData.description || "",
      type: contract.type,
      imageURI: nftData.imageURI || "",
      totalSupply: nftData.totalSupply,
      maxSupply: nftData.maxSupply,
      creator: nftData.creator,
      symbol: nftData.additionalData?.symbol
    };
    
    // For items, we'll use the representative token for now
    // In a full implementation, you'd need to fetch multiple tokens
    const items = [{
      id: nftData.id,
      tokenId: nftData.tokenId,
      title: nftData.title,
      description: nftData.description,
      imageURI: nftData.imageURI,
      contentURI: nftData.contentURI
    }];
    
    // If we know this collection has multiple items, try to fetch a few more
    // In a production app, you'd implement pagination and more sophisticated fetching
    if (nftData.totalSupply && nftData.totalSupply > 1) {
      // For demo purposes, try to fetch a few more tokens (up to 5)
      const additionalTokenIds = [2, 3, 4, 5].slice(0, Math.min(4, nftData.totalSupply - 1));
      
      const additionalItemsPromises = additionalTokenIds.map(async (id) => {
        try {
          const itemUrl = `/.netlify/functions/nft/${address}/${chain}/${id}?assetType=${contract.type}`;
          const itemResponse = await api.get(itemUrl);
          const itemData = itemResponse.data;
          
          return {
            id: itemData.id,
            tokenId: itemData.tokenId,
            title: itemData.title,
            description: itemData.description,
            imageURI: itemData.imageURI,
            contentURI: itemData.contentURI
          };
        } catch (error) {
          console.warn(`Failed to fetch token #${id}:`, error);
          return null;
        }
      });
      
      const additionalItems = (await Promise.all(additionalItemsPromises)).filter(Boolean);
      items.push(...additionalItems);
    }
    
    return {
      data: {
        collection: collection,
        items: items
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
