import { trackedContracts } from '../config/contracts';
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
    console.log(`Making API request to ${API_BASE_URL}/collections with params:`, { chain, limit });
    
    const response = await api.get('/collections', {
      params: { chain, limit }
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

export const fetchCollectionDetail = async (address, chain = 'all') => {
  try {
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

// NFT tracking API
export const initializeTracking = async () => {
  try {
    // For each tracked contract, call the API to register it for tracking
    const results = await Promise.all(
      trackedContracts.map(async (contract) => {
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