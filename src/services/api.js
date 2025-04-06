// src/services/api.js
import * as hubApi from './hubApiClient';
import * as registryApi from './registryApiClient';

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
        items: limitedCollections.map(collection => ({
          contractAddress: collection.address,
          chain: collection.chain,
          name: collection.name || "Unknown Collection",
          description: collection.description || "",
          type: collection.type || 'book',
          imageURI: collection.image || "",
          contentURI: collection.url || "",
          totalSupply: collection.totalSupply || 100,
          creator: collection.creator || ""
        }))
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

// Export all functions from both APIs
export default {
  ...hubApi.default,
  ...registryApi.default,
  fetchCollections,
  fetchCollectionDetail
};
