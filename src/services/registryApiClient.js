// src/services/registryApiClient.js
import axios from 'axios';

// Hardcoded Registry API URL - no need for env variables for public URLs
const REGISTRY_API_URL = 'https://reggie-db.netlify.app';

// Create axios instance with default config
const registryApi = axios.create({
  baseURL: REGISTRY_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch the complete registry
 * @returns {Promise<Object>} Registry data organized by chain
 */
export const fetchRegistry = async () => {
  try {
    const response = await registryApi.get('/.netlify/functions/registry');
    return response.data;
  } catch (error) {
    console.error('Error fetching registry:', error);
    
    // Return a minimal registry as fallback
    return {
      ethereum: [],
      base: [],
      polygon: [],
      optimism: [],
      zora: []
    };
  }
};

/**
 * Update the registry (requires authentication)
 * @param {Object} updatedRegistry - The updated registry data
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<Object>} Response from the update operation
 */
export const updateRegistry = async (updatedRegistry, apiKey) => {
  try {
    const response = await registryApi.put('/.netlify/functions/registry', updatedRegistry, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error updating registry:', error);
    throw error;
  }
};

/**
 * Find a collection in the registry by address
 * @param {string} address - Contract address to find
 * @param {string} chain - Optional chain to limit search
 * @returns {Promise<Object|null>} The collection if found, null otherwise
 */
export const findCollectionByAddress = async (address, chain = null) => {
  try {
    const registry = await fetchRegistry();
    
    // If chain is specified, only search that chain
    if (chain && registry[chain]) {
      return registry[chain].find(c => 
        c.address.toLowerCase() === address.toLowerCase()
      ) || null;
    }
    
    // Search all chains
    for (const [chainName, collections] of Object.entries(registry)) {
      const found = collections.find(c => 
        c.address.toLowerCase() === address.toLowerCase()
      );
      
      if (found) {
        return {
          ...found,
          chain: chainName
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding collection by address:', error);
    return null;
  }
};

/**
 * Get collections filtered by chain
 * @param {string} chain - Chain to filter by, or 'all' for all chains
 * @returns {Promise<Array>} Array of collections
 */
export const getCollections = async (chain = 'all') => {
  try {
    const registry = await fetchRegistry();
    
    if (chain === 'all') {
      // Return all collections from all chains
      return Object.entries(registry).flatMap(([chainName, collections]) => 
        collections.map(collection => ({
          ...collection,
          chain: chainName
        }))
      );
    }
    
    // Return collections for specific chain
    if (registry[chain]) {
      return registry[chain].map(collection => ({
        ...collection,
        chain
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting collections:', error);
    return [];
  }
};

export default {
  fetchRegistry,
  updateRegistry,
  findCollectionByAddress,
  getCollections
};
