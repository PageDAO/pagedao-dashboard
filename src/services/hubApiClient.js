// src/services/hubApiClient.js
import axios from 'axios';

// Hardcoded Hub API URL - no need for env variables for public URLs
const HUB_API_URL = 'https://pagedao-hub-serverless-api.netlify.app';

// Create axios instance with default config
const hubApi = axios.create({
  baseURL: HUB_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch collection information from the Hub API
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {string} assetType - Asset type (book, alexandria_book, etc.)
 * @returns {Promise<Object>} Collection information
 */
export const fetchCollectionInfo = async (address, chain, assetType = 'book') => {
  try {
    const url = `/.netlify/functions/nft/${address}/${chain}/collection-info`;
    const response = await hubApi.get(url, {
      params: { assetType }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching collection info:', error);
    throw error;
  }
};

/**
 * Fetch token metadata from the Hub API
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {string} tokenId - Token ID
 * @param {string} assetType - Asset type (book, alexandria_book, etc.)
 * @returns {Promise<Object>} Token metadata
 */
export const fetchTokenMetadata = async (address, chain, tokenId, assetType = 'book') => {
  try {
    const url = `/.netlify/functions/nft/${address}/${chain}/${tokenId}`;
    const response = await hubApi.get(url, {
      params: { assetType }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    throw error;
  }
};

/**
 * Fetch batch of tokens from the Hub API
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {Array<string>} tokenIds - Array of token IDs
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Batch of token data
 */
export const fetchTokenBatch = async (address, chain, tokenIds = [], options = {}) => {
  try {
    const tokenIdsParam = Array.isArray(tokenIds) ? tokenIds.join(',') : tokenIds;
    const assetType = options.assetType || 'book';
    const includeOwnership = options.includeOwnership ? 'true' : 'false';
    
    const url = `/.netlify/functions/nft/batch/${address}/${chain}`;
    const response = await hubApi.get(url, {
      params: {
        assetType,
        tokenIds: tokenIdsParam,
        includeOwnership
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching token batch:', error);
    throw error;
  }
};

/**
 * Fetch token prices from the Hub API
 * @returns {Promise<Object>} Token prices data
 */
export const fetchTokenPrices = async () => {
  try {
    const response = await hubApi.get('/.netlify/functions/token-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
};

/**
 * Fetch historical data from the Hub API
 * @param {string} chain - Chain to filter by, or 'all' for all chains
 * @param {string} period - Time period (e.g., '24h', '7d', '30d')
 * @returns {Promise<Object>} Historical data
 */
export const fetchHistoricalData = async (chain = 'all', period = '24h') => {
  try {
    const response = await hubApi.get('/.netlify/functions/historical-data', {
      params: { chain, period }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

export default {
  fetchCollectionInfo,
  fetchTokenMetadata,
  fetchTokenBatch,
  fetchTokenPrices,
  fetchHistoricalData
};
