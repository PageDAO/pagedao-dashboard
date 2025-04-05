// src/services/api.js
import axios from 'axios';
import { fetchRegistry } from './registryService';

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

// Collections API - Updated to use registry directly
export const fetchCollections = async (chain = 'all', limit = 12) => {
  try {
    // Get contracts from registry
    const registry = await fetchRegistry();
    
    let contracts = [];
    
    if (chain === 'all') {
      // Combine all chains
      contracts = Object.entries(registry).flatMap(([chainName, chainContracts]) => 
        chainContracts.map(contract => ({
          ...contract,
          chain: chainName,
          contractAddress: contract.address, // Ensure consistent property name
          imageURI: contract.image, // Map image field to imageURI for consistency
          type: contract.type || 'book'
        }))
      );
    } else if (registry[chain]) {
      // Get contracts for specific chain
      contracts = registry[chain].map(contract => ({
        ...contract,
        chain,
        contractAddress: contract.address,
        imageURI: contract.image,
        type: contract.type || 'book'
      }));
    }
    
    // Apply limit
    contracts = contracts.slice(0, limit);
    
    console.log(`Fetched ${contracts.length} collections from registry for chain: ${chain}`);
    
    // Format the response to match the expected structure
    return {
      data: {
        items: contracts
      }
    };
  } catch (error) {
    console.error('Error fetching collections from registry:', error);
    return {
      data: {
        items: []
      }
    };
  }
};

// Fetch collection detail
export const fetchCollectionDetail = async (address, chain, page = 1, pageSize = 20) => {
  try {
    // Fetch from registry
    const registry = await fetchRegistry();
    
    // Find the collection in the registry
    let collection = null;
    
    if (chain && registry[chain]) {
      collection = registry[chain].find(c => 
        c.address.toLowerCase() === address.toLowerCase()
      );
    } else {
      // Search all chains if not found
      for (const [chainName, collections] of Object.entries(registry)) {
        const found = collections.find(c => 
          c.address.toLowerCase() === address.toLowerCase()
        );
        if (found) {
          collection = found;
          chain = chainName; // Set the chain
          break;
        }
      }
    }
    
    if (!collection) {
      console.warn(`Collection not found in registry: ${address} on ${chain}`);
      // Fallback to API if not in registry
      return fallbackFetchCollectionDetail(address, chain, page, pageSize);
    }
    
    // Transform to expected format
    const transformedCollection = {
      contractAddress: address,
      chain: chain,
      name: collection.name || "Unknown Collection",
      description: collection.description || "",
      type: collection.type || 'book',
      imageURI: collection.image || "",
      contentURI: collection.url || "",
      totalSupply: collection.totalSupply || 100, // Default if not specified
      creator: collection.creator || ""
    };
    
    // For now, fake the items (this would be replaced with real data)
    const items = Array.from({ length: Math.min(pageSize, 10) }, (_, i) => ({
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
          totalItems: 100, // Default
          totalPages: Math.ceil(100 / pageSize),
          hasNextPage: page * pageSize < 100,
          hasPrevPage: page > 1
        }
      }
    };
  } catch (error) {
    console.error('Error fetching collection detail from registry:', error);
    return fallbackFetchCollectionDetail(address, chain, page, pageSize);
  }
};

// Fallback to the API if registry fails
const fallbackFetchCollectionDetail = async (address, chain, page = 1, pageSize = 20) => {
  try {
    console.log(`Falling back to API for collection detail: ${address} on ${chain}`);
    
    // Call the collection-info endpoint
    const collectionUrl = `/.netlify/functions/nft/${address}/${chain}/collection-info`;
    const response = await api.get(collectionUrl);
    
    const collectionData = response.data;
    
    // Create a collection object
    const collection = {
      contractAddress: address,
      chain: chain,
      name: collectionData.name || "Unknown Collection",
      description: collectionData.description || "",
      type: collectionData.type || 'book',
      imageURI: collectionData.imageURI || "",
      totalSupply: collectionData.totalSupply,
      creator: collectionData.creator
    };
    
    // For simplicity, we'll return placeholder items
    const items = [];
    
    return {
      data: {
        collection,
        items,
        pagination: {
          currentPage: page,
          pageSize: pageSize,
          totalItems: 0,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false
        }
      }
    };
  } catch (error) {
    console.error('Fallback error fetching collection detail:', error);
    // Return placeholder data
    return {
      data: {
        collection: {
          contractAddress: address,
          chain: chain,
          name: "Unknown Collection",
          description: "Collection data unavailable"
        },
        items: [],
        pagination: {
          currentPage: 1,
          pageSize: 10,
          totalItems: 0,
          totalPages: 0
        }
      }
    };
  }
};

// Book detail - simplify to use registry when possible
export const fetchBookDetail = async (address, chain, tokenId) => {
  try {
    // Try to get from registry first
    const registry = await fetchRegistry();
    
    // Find the book in the registry
    let book = null;
    
    if (chain && registry[chain]) {
      book = registry[chain].find(c => 
        c.address.toLowerCase() === address.toLowerCase()
      );
    } else {
      // Search all chains if not found
      for (const [chainName, books] of Object.entries(registry)) {
        const found = books.find(c => 
          c.address.toLowerCase() === address.toLowerCase()
        );
        if (found) {
          book = found;
          chain = chainName; // Set the chain
          break;
        }
      }
    }
    
    if (book) {
      // Return registry data
      return {
        contractAddress: address,
        chain: chain,
        tokenId: tokenId,
        title: book.name,
        description: book.description || "",
        imageURI: book.image || "",
        contentURI: book.url || "",
        creator: book.creator || "",
        additionalData: {
          author: book.creator,
          publisher: book.publisher
        }
      };
    }
    
    // Fallback to API if not in registry
    console.log(`Book not found in registry, falling back to API: ${address} on ${chain} token ${tokenId}`);
    
    // Call the API to get book metadata
    const url = `/.netlify/functions/nft/${address}/${chain}/${tokenId}`;
    const response = await api.get(url);
    
    let bookData = response.data;
    
    // If response has a nested data property, use that as our book data
    if (bookData.success && bookData.data) {
      bookData = bookData.data;
    }
    
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
      }
    }
    
    // Check metadata fields if available
    if (bookData.metadata && typeof bookData.metadata === 'object') {
      for (const field of urlFieldsToCheck) {
        if (bookData.metadata[field] && !bookData.contentURI) {
          bookData.contentURI = bookData.metadata[field];
        }
      }
    }
    
    return bookData;
  } catch (error) {
    console.error('Error fetching book detail:', error);
    // Return minimal placeholder data
    return {
      contractAddress: address,
      chain: chain,
      tokenId: tokenId,
      title: "Unknown Book",
      description: "Book data unavailable"
    };
  }
};

// Books API functions - simplified to use registry
export const fetchBooks = async (limit = 12) => {
  try {
    // Use the registry to get all collections
    const allCollections = await fetchCollections('all', limit * 2); // Get more to filter
    
    // Filter to only include book collections
    const bookCollections = allCollections.data.items.filter(c => 
      c.type === 'book' || 
      c.type === 'alexandria_book' || 
      c.type === 'alexandria-book' ||
      c.contentType === 'book' ||
      c.contentType === 'novel'
    ).slice(0, limit);
    
    return {
      data: {
        items: bookCollections
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

// Token prices API - Unchanged
export const fetchTokenPrices = async () => {
  try {
    const response = await api.get('/.netlify/functions/token-prices');
    return response.data;
  } catch (error) {
    console.error('Error fetching token prices:', error);
    throw error;
  }
};

// Historical data API - Unchanged
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

// Network comparison API
export const fetchNetworkComparison = async () => {
  try {
    const response = await api.get('/.netlify/functions/network-comparison');
    return response.data;
  } catch (error) {
    console.error('Error fetching network comparison:', error);
    throw error;
  }
};

// Initialize tracking - Simplified to use registry
export const initializeTracking = async () => {
  try {
    // Get all contracts from registry
    const registry = await fetchRegistry();
    
    const allContracts = Object.entries(registry).flatMap(([chain, contracts]) => 
      contracts.map(contract => ({ ...contract, chain }))
    );
    
    console.log(`Initialized tracking for ${allContracts.length} contracts from registry`);
    
    return {
      success: true,
      contracts: allContracts
    };
  } catch (error) {
    console.error('Error initializing tracking:', error);
    return {
      success: false,
      error: error.message
    };
  }
};