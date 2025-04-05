// src/services/registryService.js
import axios from 'axios';

// Use your own domain for the registry API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pagedao-hub-serverless-api.netlify.app';

// Create axios instance for registry API
const registryApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
});

/**
 * Fetch the entire registry of collections
 */
export const fetchRegistry = async () => {
  try {
    // Use registry-proxy instead of directly calling the external API
    const response = await registryApi.get('/.netlify/functions/registry-proxy');
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
 * Update the registry (requires API key)
 * @param {Object} updatedRegistry - The updated registry data
 * @param {string} apiKey - The API key for authentication
 */
export const updateRegistry = async (updatedRegistry, apiKey) => {
  try {
    const response = await registryApi.put('/registry', updatedRegistry, {
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
 * Add a collection to the registry
 * @param {string} chain - The blockchain name
 * @param {Object} collection - The collection data
 * @param {string} apiKey - The API key for authentication
 */
export const addCollection = async (chain, collection, apiKey) => {
  try {
    // First fetch the current registry
    const registry = await fetchRegistry();
    
    // Ensure the chain exists in the registry
    if (!registry[chain]) {
      registry[chain] = [];
    }
    
    // Add the new collection to the chain
    registry[chain].push({
      ...collection,
      dateAdded: new Date().toISOString()
    });
    
    // Update the registry
    return await updateRegistry(registry, apiKey);
  } catch (error) {
    console.error('Error adding collection:', error);
    throw error;
  }
};

/**
 * Remove a collection from the registry
 * @param {string} chain - The blockchain name
 * @param {string} address - The collection contract address
 * @param {string} apiKey - The API key for authentication
 */
export const removeCollection = async (chain, address, apiKey) => {
  try {
    // First fetch the current registry
    const registry = await fetchRegistry();
    
    // Ensure the chain exists
    if (!registry[chain]) {
      throw new Error(`Chain ${chain} not found in registry`);
    }
    
    // Filter out the collection to remove
    registry[chain] = registry[chain].filter(collection => 
      collection.address.toLowerCase() !== address.toLowerCase()
    );
    
    // Update the registry
    return await updateRegistry(registry, apiKey);
  } catch (error) {
    console.error('Error removing collection:', error);
    throw error;
  }
};

/**
 * Update a collection in the registry
 */
export const updateCollection = async (chain, address, updatedData, apiKey) => {
  try {
    // First fetch the current registry
    const registry = await fetchRegistry();
    
    // Ensure the chain exists
    if (!registry[chain]) {
      throw new Error(`Chain ${chain} not found in registry`);
    }
    
    // Find and update the collection
    registry[chain] = registry[chain].map(collection => {
      if (collection.address.toLowerCase() === address.toLowerCase()) {
        return {
          ...collection,
          ...updatedData,
          lastUpdated: new Date().toISOString()
        };
      }
      return collection;
    });
    
    // Update the registry
    return await updateRegistry(registry, apiKey);
  } catch (error) {
    console.error('Error updating collection:', error);
    throw error;
  }
};