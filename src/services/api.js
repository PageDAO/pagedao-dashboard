import axios from 'axios';
import * as hubApi from './hubApiClient';
import * as registryApi from './registryApiClient';
import { featuredCollections } from '../config/featuredCollections';

const API_BASE_URL = 'https://pagedao-hub-serverless-api.netlify.app';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch collections with metadata
 * @param {string} chain - Chain to filter by, or 'all' for all chains
 * @param {number} limit - Maximum number of collections to return
 * @returns {Promise<Object>} Collections with metadata
 */
export const fetchCollections = async (chain = 'all', limit = 12) => {
  try {
    // Get collections from registry
    const collections = await registryApi.getCollections(chain);
    
    // Apply limit
    const limitedCollections = collections.slice(0, limit);
    
    // Format the response to match the expected structure
    return {
      data: {
        items: limitedCollections.map(collection => {
          // Check if this collection is in our featured list
          const isFeatured = featuredCollections.some(
            featuredItem => 
              featuredItem.address.toLowerCase() === (collection.address || '').toLowerCase() &&
              (chain === 'all' || featuredItem.chain === collection.chain)
          );
          
          return {
            contractAddress: collection.address,
            chain: collection.chain,
            name: collection.name || "Unknown Collection",
            description: collection.description || "",
            type: collection.type || 'book',
            imageURI: collection.image || "",
            contentURI: collection.url || "",
            totalSupply: collection.totalSupply || 100,
            creator: collection.creator || "",
            featured: isFeatured // Set the featured flag based on our list
          };
        })
      }
    };
  } catch (error) {
    console.error('Error fetching collections:', error);
    return {
      data: {
        items: []
      }
    };
  }
};

/**
 * Fetch collection detail with items
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {number} page - Page number for pagination
 * @param {number} pageSize - Items per page
 * @returns {Promise<Object>} Collection detail with items
 */
export const fetchCollectionDetail = async (address, chain, page = 1, pageSize = 20) => {
  try {
    // Try to get collection from registry first
    let collection = await registryApi.findCollectionByAddress(address, chain);
    
    if (!collection) {
      // If not in registry, try to get from Hub API
      try {
        const collectionInfo = await hubApi.fetchCollectionInfo(address, chain);
        collection = {
          address,
          chain,
          name: collectionInfo.name,
          description: collectionInfo.description,
          image: collectionInfo.imageURI,
          totalSupply: collectionInfo.totalSupply
        };
      } catch (error) {
        console.error('Error fetching collection from Hub API:', error);
        // Create minimal collection object
        collection = {
          address,
          chain,
          name: "Unknown Collection",
          description: "Collection data unavailable"
        };
      }
    }
    
    // Transform to expected format
    const transformedCollection = {
      contractAddress: address,
      chain: collection.chain,
      name: collection.name || "Unknown Collection",
      description: collection.description || "",
      type: collection.type || 'book',
      imageURI: collection.image || "",
      contentURI: collection.url || "",
      totalSupply: collection.totalSupply || 100,
      creator: collection.creator || ""
    };
    
    // Calculate pagination
    const totalItems = collection.totalSupply || 100;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // For now, return placeholder items
    // In a real implementation, you would fetch actual items from the Hub API
    const items = Array.from({ length: Math.min(pageSize, totalItems - (page - 1) * pageSize) }, (_, i) => ({
      tokenId: (page - 1) * pageSize + i + 1,
      name: `${collection.name} #${(page - 1) * pageSize + i + 1}`,
      description: collection.description,
      imageURI: collection.image
    }));
    
    return {
      data: {
        collection: transformedCollection,
        items,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalItems,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    };
  } catch (error) {
    console.error('Error fetching collection detail:', error);
    return {
      data: {
        collection: {
          contractAddress: address,
          chain,
          name: "Unknown Collection",
          description: "Collection data unavailable"
        },
        items: [],
        pagination: {
          currentPage: 1,
          pageSize: pageSize,
          totalItems: 0,
          totalPages: 0
        }
      }
    };
  }
};

/**
 * Fetch book detail
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {string} tokenId - Token ID
 * @returns {Promise<Object>} Book details
 */
export const fetchBookDetail = async (address, chain, tokenId) => {
  try {
    const bookData = await hubApi.fetchTokenMetadata(address, chain, tokenId);
    return bookData;
  } catch (error) {
    console.error('Error fetching book detail:', error);
    return {
      contractAddress: address,
      chain: chain,
      tokenId: tokenId,
      title: "Unknown Book",
      description: "Book data unavailable"
    };
  }
};

/**
 * Fetch books from the registry
 * @param {number} limit - Maximum number of books to return
 * @returns {Promise<Object>} Books data
 */
export const fetchBooks = async (limit = 12) => {
  try {
    // Get collections from registry
    const collections = await registryApi.getCollections('all');
    
    // Filter to only include book collections
    const bookCollections = collections
      .filter(c => 
        c.type === 'book' || 
        c.type === 'alexandria_book' || 
        c.type === 'polygon_book' ||
        c.contentType === 'book' ||
        c.contentType === 'novel'
      )
      .slice(0, limit);
    
    return {
      data: {
        items: bookCollections.map(book => ({
          contractAddress: book.address,
          chain: book.chain,
          name: book.name || "Unknown Book",
          description: book.description || "",
          type: book.type || 'book',
          imageURI: book.image || "",
          contentURI: book.url || "",
          totalSupply: book.totalSupply || 100,
          creator: book.creator || ""
        }))
      }
    };
  } catch (error) {
    console.error('Error fetching books:', error);
    return {
      data: {
        items: []
      }
    };
  }
};

/**
 * Fetch featured books
 * @param {number} limit - Maximum number of featured books to return
 * @returns {Promise<Object>} Featured books data
 */
export const fetchFeaturedBooks = async (limit = 4) => {
  try {
    // Get books and optionally filter for featured flag
    const booksResponse = await fetchBooks(limit * 2);
    
    // Filter for featured collections if the property exists
    const featuredBooks = booksResponse.data.items
      .filter(book => book.featured === true)
      .slice(0, limit);
    
    // If no featured books found, just return the first few
    if (featuredBooks.length === 0) {
      return {
        data: {
          items: booksResponse.data.items.slice(0, limit)
        }
      };
    }
    
    return {
      data: {
        items: featuredBooks
      }
    };
  } catch (error) {
    console.error('Error fetching featured books:', error);
    return {
      data: {
        items: []
      }
    };
  }
};

/**
 * Fetch token prices
 * @returns {Promise<Object>} Token prices data
 */
export const fetchTokenPrices = async () => {
  try {
    return await hubApi.fetchTokenPrices();
  } catch (error) {
    console.error('Error fetching token prices:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Fetch historical data
 * @param {string} chain - Chain to filter by, or 'all' for all chains
 * @param {string} period - Time period (e.g., '24h', '7d', '30d')
 * @returns {Promise<Object>} Historical data
 */
export const fetchHistoricalData = async (chain = 'all', period = '24h') => {
  try {
    return await hubApi.fetchHistoricalData(chain, period);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
};

/**
 * Fetch network comparison data
 * @returns {Promise<Object>} Network comparison data
 */
export const fetchNetworkComparison = async () => {
  try {
    const response = await api.get('/.netlify/functions/network-comparison');
    return response.data;
  } catch (error) {
    console.error('Error fetching network comparison:', error);
    throw error;
  }
};

/**
 * Initialize tracking for contracts in the registry
 * @returns {Promise<Object>} Tracking initialization result
 */
export const initializeTracking = async () => {
  try {
    // Get all contracts from registry
    const registry = await registryApi.fetchRegistry();
    
    const allContracts = Object.entries(registry).flatMap(([chainName, contracts]) => 
      contracts.map(contract => ({
        ...contract,
        chain: chainName,
        contractAddress: contract.address
      }))
    );
    
    console.log(`Initializing tracking for ${allContracts.length} contracts from registry`);
    
    return {
      success: true,
      contracts: allContracts
    };
  } catch (error) {
    console.error('Error initializing tracking for contracts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Re-export functions from the API clients
export const {
  fetchRegistry,
  updateRegistry,
  findCollectionByAddress,
  getCollections
} = registryApi;

export const {
  fetchCollectionInfo,
  fetchTokenMetadata,
  fetchTokenBatch
} = hubApi;

// Export default object with all functions
export default {
  // Registry API functions
  fetchRegistry,
  updateRegistry,
  findCollectionByAddress,
  getCollections,
  
  // Hub API functions
  fetchCollectionInfo,
  fetchTokenMetadata,
  fetchTokenBatch,
  
  // Combined API functions
  fetchCollections,
  fetchCollectionDetail,
  fetchBookDetail,
  fetchBooks,
  fetchFeaturedBooks,
  fetchTokenPrices,
  fetchHistoricalData,
  fetchNetworkComparison,
  initializeTracking
};