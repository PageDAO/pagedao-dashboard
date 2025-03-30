import { getContractByAddress, getContracts } from '../contracts/registry';
import axios from 'axios';

// API base URL - from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8888/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Collections API
export const fetchCollections = async (chain = 'all', limit = 12) => {
  try {
    // Get contracts from registry
    const contracts = getContracts(chain);
    
    if (contracts.length === 0) {
      console.warn(`No contracts found for chain: ${chain}`);
      return { data: { items: [] } };
    }
    
    // Extract addresses and chains
    const addresses = contracts.map(c => c.address);
    const chains = contracts.map(c => c.chain);
    
    console.log(`Making API request to ${API_BASE_URL}/collections with addresses:`, addresses);
    
    const response = await api.get('/collections', {
      params: { 
        addresses: addresses.join(','),
        chains: chains.join(','),
        limit 
      }
    });
    
    console.log('Raw API response:', response);
    
    // Check if the response has the expected structure
    if (!response.data || !response.data.data) {
      console.warn('API response is missing expected data structure:', response);
      return { data: { items: [] } };
    }
    
    return response.data;
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
    
    const collectionResponse = await api.get(`/collections/${address}`, {
      params: { chain }
    });
    
    const itemsResponse = await api.get(`/collections/${address}/items`, {
      params: { chain, limit: 20 }
    });
    
    return {
      data: {
        collection: collectionResponse.data.data,
        items: itemsResponse.data.data.items
      }
    };
  } catch (error) {
    console.error('Error fetching collection detail:', error);
    throw error;
  }
};

// Books API functions
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
    
    // Extract addresses and chains
    const addresses = bookContracts.map(c => c.address);
    const chains = bookContracts.map(c => c.chain);
    
    const response = await api.get('/books', {
      params: { 
        addresses: addresses.join(','),
        chains: chains.join(','),
        limit 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching books:', error);
    throw error;
  }
};

export const fetchFeaturedBooks = async (limit = 4) => {
  try {
    // Get featured book contracts (you could add a featured flag in your registry)
    // For now, just using the first few book contracts
    const bookContracts = getContracts('all').filter(c => 
      c.type === 'book' || 
      c.type === 'alexandria_book' || 
      c.type === 'polygon_book'
    ).slice(0, limit);
    
    if (bookContracts.length === 0) {
      console.warn('No featured book contracts found in registry');
      return { data: { items: [] } };
    }
    
    // Extract addresses and chains
    const addresses = bookContracts.map(c => c.address);
    const chains = bookContracts.map(c => c.chain);
    
    const response = await api.get('/books/featured', {
      params: { 
        featuredAddresses: addresses.join(','),
        chains: chains.join(','),
        limit 
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching featured books:', error);
    throw error;
  }
};

// Token prices API - keep existing functions
export const fetchTokenPrices = async () => {
  try {
    const response = await api.get('/token-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
};

// Historical data API
export const fetchHistoricalData = async (chain = 'all', period = '24h') => {
  try {
    const response = await api.get('/historical-data', {
      params: { chain, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

// Network comparison API
export const fetchNetworkComparison = async () => {
  try {
    const response = await api.get('/network-comparison');
    return response.data;
  } catch (error) {
    console.error('Error fetching network comparison:', error);
    throw error;
  }
};

// NFT tracking API - modified to use registry
export const initializeTracking = async () => {
  try {
    // Get all contracts from registry
    const allContracts = getContracts('all');
    
    // For each contract in the registry, call the API to register it for tracking
    const results = await Promise.all(
      allContracts.map(async (contract) => {
        // This should match your API endpoint for registering collections
        const response = await api.post('/collections/register', {
          chain: contract.chain,
          address: contract.address,
          type: contract.type,
          name: contract.name
        });
        
        return {
          ...contract,
          result: response.data
        };
      })
    );
    
    console.log('Initialized tracking for contracts:', results);
    return results;
  } catch (error) {
    console.error('Error initializing tracking for contracts:', error);
    throw error;
  }
};