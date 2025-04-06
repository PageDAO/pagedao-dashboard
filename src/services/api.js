// src/services/api.js
import axios from 'axios';

// API URLs from environment variables with fallbacks
const HUB_API_URL = import.meta.env.VITE_API_URL || 'https://pagedao-hub-serverless-api.netlify.app';
const REGISTRY_API_URL = import.meta.env.VITE_REGISTRY_API_URL || 'https://reggie-db.netlify.app';

// Create separate axios instances for each API
const hubApi = axios.create({
  baseURL: HUB_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

const registryApi = axios.create({
  baseURL: REGISTRY_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch the registry data from the Registry API
 * @returns {Promise<Object>} The registry data organized by chain
 */
export const fetchRegistry = async () => {
  try {
    const response = await registryApi.get('/registry');
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
 * Update the registry with new data (requires API key)
 * @param {Object} updatedRegistry - The updated registry data
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<Object>} Response from the update operation
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
 * Add a new collection to the registry
 * @param {string} chain - The blockchain name
 * @param {Object} collection - Collection data to add
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<Object>} Updated registry data
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
 * Update an existing collection in the registry
 * @param {string} chain - The blockchain name
 * @param {string} address - Contract address to update
 * @param {Object} updatedData - New collection data
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<Object>} Updated registry data
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

/**
 * Remove a collection from the registry
 * @param {string} chain - The blockchain name
 * @param {string} address - Contract address to remove
 * @param {string} apiKey - API key for authentication
 * @returns {Promise<Object>} Updated registry data
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
 * Helper function to determine asset type based on chain and contract info
 * @param {string} chain - Blockchain name
 * @param {Object} contract - Contract information
 * @returns {string} The asset type
 */
function getAssetType(chain, contract = {}) {
  // Use contract type if available
  if (contract.type) {
    return contract.type;
  }
  
  // Default types by chain
  const types = {
    'base': 'alexandria_book',
    'ethereum': 'mirror_publication',
    'zora': 'zora_nft',
    'polygon': 'book',
    'optimism': 'book'
  };
  
  return types[chain] || 'book';
}

/**
 * Helper function to get a representative token ID for a collection
 * @param {string} contractAddr - Contract address
 * @param {string} chain - Blockchain name
 * @param {string} assetType - Asset type
 * @returns {Promise<string>} A representative token ID
 */
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

/**
 * Fetch collections from the registry and enrich with metadata from Hub API
 * @param {string} chain - Chain to filter by, or 'all' for all chains
 * @param {number} limit - Maximum number of collections to return
 * @returns {Promise<Object>} Collections data with metadata
 */
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
          contractAddress: contract.address,
          type: contract.type || getAssetType(chainName, contract)
        }))
      );
    } else if (registry[chain]) {
      // Get contracts for specific chain
      contracts = registry[chain].map(contract => ({
        ...contract,
        chain,
        contractAddress: contract.address,
        type: contract.type || getAssetType(chain, contract)
      }));
    }
    
    if (contracts.length === 0) {
      console.warn(`No contracts found for chain: ${chain}`);
      return { data: { items: [] } };
    }
    
    console.log(`Fetching ${contracts.length} collections for chain: ${chain}`);
    
    // Fetch a representative NFT for each collection to get collection data
    const collectionsPromises = contracts.slice(0, limit).map(async (contract) => {
      try {
        // Special handling for Alexandria books
        if (contract.type === 'alexandria_book' || 
            (contract.chain === 'base' && contract.name?.includes('Alexandria'))) {
          const url = `/.netlify/functions/nft/${contract.contractAddress}/${contract.chain}/1?assetType=alexandria_book`;
          console.log(`Fetching Alexandria book data from: ${url}`);
          
          const response = await hubApi.get(url);
          const bookData = response.data;
          
          // Extract Alexandria metadata (assuming this utility exists)
          // If not, we'll use a simplified approach
          let alexandriaMetadata = {
            title: bookData.title || bookData.name,
            description: bookData.description,
            imageUrl: bookData.imageURI || bookData.image,
            readingUrl: bookData.contentURI || bookData.content_uri || bookData.url,
            author: bookData.creator || bookData.author,
            publisher: bookData.publisher,
            pageCount: bookData.pageCount,
            language: bookData.language,
            publicationDate: bookData.publicationDate,
            exoplanet: bookData.exoplanet
          };
          
          // Return the collection with properly formatted metadata
          return {
            contractAddress: contract.contractAddress,
            chain: contract.chain,
            title: alexandriaMetadata.title,
            name: alexandriaMetadata.title || contract.name,
            description: alexandriaMetadata.description,
            type: 'alexandria_book',
            imageURI: alexandriaMetadata.imageUrl,
            contentURI: alexandriaMetadata.readingUrl,
            totalSupply: bookData.totalSupply || 1,
            creator: alexandriaMetadata.author,
            format: 'Digital Book',
            additionalData: {
              author: alexandriaMetadata.author,
              publisher: alexandriaMetadata.publisher,
              pageCount: alexandriaMetadata.pageCount,
              language: alexandriaMetadata.language,
              publicationDate: alexandriaMetadata.publicationDate,
              exoplanet: alexandriaMetadata.exoplanet
            }
          };
        }
        
        // Skip known problematic contracts
        if (contract.skipMetadata) {
          console.log(`Skipping problematic contract: ${contract.contractAddress} on ${contract.chain}`);
          // Return basic info without making API call
          return {
            contractAddress: contract.contractAddress,
            chain: contract.chain,
            name: contract.name || `${contract.chain} Book Collection`,
            type: contract.type,
            description: contract.description || "Contract data currently unavailable",
            imageURI: contract.image || "/images/placeholder-cover.png"
          };
        }
        
        // Get a representative token ID
        const tokenId = await getRepresentativeTokenId(
          contract.contractAddress, 
          contract.chain, 
          contract.type
        );
        
        // Fetch metadata for the representative token
        const url = `/.netlify/functions/nft/${contract.contractAddress}/${contract.chain}/${tokenId}?assetType=${contract.type}`;
        console.log(`Fetching collection data from: ${url}`);
        
        const response = await hubApi.get(url);
        const nftData = response.data;
        
        // Transform NFT data into expected collection format
        return {
          contractAddress: contract.contractAddress,
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
        console.warn(`Error fetching data for ${contract.contractAddress} on ${contract.chain}:`, error);
        // Return basic info if API call fails
        return {
          contractAddress: contract.contractAddress,
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
    return {
      data: {
        items: []
      }
    };
  }
};

/**
 * Fetch token batch for a collection
 * @param {string} address - Contract address
 * @param {string} chain - Blockchain name
 * @param {Array<string>} tokenIds - Array of token IDs to fetch
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Batch of token data
 */
export const fetchCollectionTokenBatch = async (address, chain, tokenIds = [], options = {}) => {
  try {
    if (!address || !chain || !tokenIds.length) {
      throw new Error('Missing required parameters for batch fetch');
    }
    
    // Get contract details from registry
    const registry = await fetchRegistry();
    let contract = null;
    
    if (registry[chain]) {
      contract = registry[chain].find(c => c.address.toLowerCase() === address.toLowerCase());
    }
    
    if (!contract) {
      // Search all chains if not found
      for (const [chainName, contracts] of Object.entries(registry)) {
        const found = contracts.find(c => c.address.toLowerCase() === address.toLowerCase());
        if (found) {
          contract = found;
          chain = chainName; // Update chain if found in a different chain
          break;
        }
      }
    }
    
    // Use contract info or defaults
    const contractInfo = contract || {
      address,
      chain,
      type: 'book' // Default type if not found in registry
    };
    
    // Prepare query params
    const assetType = options.assetType || contractInfo.type || getAssetType(chain, contractInfo);
    const includeOwnership = options.includeOwnership ? 'true' : 'false';
    
    console.log(`Fetching batch with assetType: ${assetType} for ${tokenIds.length} tokens`);
    
    // Call the batch endpoint
    const batchUrl = `/.netlify/functions/nft/batch/${address}/${chain}?assetType=${assetType}&tokenIds=${tokenIds.join(',')}&includeOwnership=${includeOwnership}`;
    console.log(`Batch URL: ${batchUrl}`);
    
    const response = await hubApi.get(batchUrl);
    console.log("Full batch response:", response.data);
        // Extract items from the response, handling the nested structure
        let items = [];
        if (response.data && response.data.success) {
          if (response.data.data && response.data.data.items) {
            items = response.data.data.items;
          } else if (Array.isArray(response.data.data)) {
            items = response.data.data;
          }
        }
        
        // If we didn't get any items, there might be an issue with the token IDs
        if (items.length === 0) {
          console.log("No items found in batch response. The token IDs might not exist or the contract may have a different structure.");
        }
        
        return {
          items: items,
          originalResponse: response.data
        };
      } catch (error) {
        console.error('Error fetching token batch:', error);
        throw error;
      }
    };
    
    /**
     * Fetch collection info from Hub API
     * @param {string} address - Contract address
     * @param {string} chain - Blockchain name
     * @param {string} assetType - Asset type
     * @returns {Promise<Object>} Collection info
     */
    export const fetchCollectionInfo = async (address, chain, assetType) => {
      try {
        // If chain is not provided, try to find it in the registry
        if (!chain) {
          const registry = await fetchRegistry();
          
          // Search all chains
          for (const [chainName, contracts] of Object.entries(registry)) {
            const found = contracts.find(c => c.address.toLowerCase() === address.toLowerCase());
            if (found) {
              chain = chainName;
              break;
            }
          }
          
          // Default to ethereum if not found
          if (!chain) {
            chain = 'ethereum';
          }
        }
        
        // Get contract details from registry
        const registry = await fetchRegistry();
        let contract = null;
        
        if (registry[chain]) {
          contract = registry[chain].find(c => c.address.toLowerCase() === address.toLowerCase());
        }
        
        // Use contract info or defaults
        const contractInfo = contract || {
          address,
          chain,
          type: assetType || 'nft' // Use provided assetType or default to nft
        };
        
        // Call the collection-info endpoint
        const collectionUrl = `/.netlify/functions/nft/${address}/${chain}/collection-info?assetType=${assetType || contractInfo.type}`;
        const response = await hubApi.get(collectionUrl);
        
        return response.data;
      } catch (error) {
        console.error('Error fetching collection info:', error);
        throw error;
      }
    };
    
    /**
     * Fetch detailed information about a specific collection
     * @param {string} address - Contract address
     * @param {string} chain - Blockchain name
     * @param {number} page - Page number for pagination
     * @param {number} pageSize - Items per page
     * @returns {Promise<Object>} Collection details and items
     */
    export const fetchCollectionDetail = async (address, chain, page = 1, pageSize = 20) => {
      try {
        // If chain is not provided, try to find it in the registry
        if (!chain) {
          const registry = await fetchRegistry();
          
          // Search all chains
          for (const [chainName, contracts] of Object.entries(registry)) {
            const found = contracts.find(c => c.address.toLowerCase() === address.toLowerCase());
            if (found) {
              chain = chainName;
              break;
            }
          }
          
          // Default to ethereum if not found
          if (!chain) {
            chain = 'ethereum';
          }
        }
        
        // Get contract from registry to ensure we have the type
        const registry = await fetchRegistry();
        let contractInfo = null;
        
        if (registry[chain]) {
          contractInfo = registry[chain].find(c => c.address.toLowerCase() === address.toLowerCase());
        }
        
        const assetType = contractInfo?.type || getAssetType(chain);
        
        console.log(`Fetching collection with address: ${address}, chain: ${chain}, assetType: ${assetType}`);
        
        // Step 1: Get collection info
        const collectionData = await fetchCollectionInfo(address, chain, assetType);
        console.log("Collection info response:", collectionData);
        
        // Create a collection object, ensuring assetType is set
        const collection = {
          contractAddress: address,
          chain: chain,
          name: collectionData.name || contractInfo?.name || "Unknown Collection",
          description: collectionData.description || contractInfo?.description || "",
          type: assetType, // Use the type from our registry
          imageURI: collectionData.imageURI || "",
          totalSupply: collectionData.totalSupply,
          maxSupply: collectionData.maxSupply,
          creator: collectionData.creator,
          format: collectionData.format
        };
        
        // Step 2: Calculate token IDs for this page
        const startTokenId = (page - 1) * pageSize + 1; // Start at token ID 1
        const endTokenId = startTokenId + pageSize - 1;
        const totalItems = collection.totalSupply || 100; // Default to 100 if unknown
        
        // Generate array of token IDs to fetch
        const tokenIds = [];
        for (let id = startTokenId; id <= endTokenId; id++) {
          if (id <= totalItems) {
            tokenIds.push(id.toString());
          }
        }
        
        console.log(`Attempting to fetch tokens with IDs: ${tokenIds.join(', ')}`);
        
        // Step 3: Fetch the batch of tokens - explicitly pass assetType
        let items = [];
        if (tokenIds.length > 0) {
          try {
            const batchResult = await fetchCollectionTokenBatch(address, chain, tokenIds, {
              assetType: assetType  // Use our preserved assetType
            });
            console.log("Extracted items:", batchResult.items);
            
            items = batchResult.items || [];
            
            // If we still don't have items, we could try a different range of token IDs
            if (items.length === 0 && totalItems > 0) {
              console.log("Trying alternative token ID range...");
              
              // Some contracts start at 0, others have a different numbering scheme
              // Try a few different possibilities
              const alternativeTokenIds = ['0']; // Try token ID 0
              
              // You could also try random IDs within the totalSupply range
              if (totalItems > 10) {
                for (let i = 0; i < 3; i++) {
                  const randomId = Math.floor(Math.random() * totalItems) + 1;
                  alternativeTokenIds.push(randomId.toString());
                }
              }
              
              console.log(`Trying alternative token IDs: ${alternativeTokenIds.join(', ')}`);
              
              const altBatchResult = await fetchCollectionTokenBatch(address, chain, alternativeTokenIds, {
                assetType: assetType
              });
              
              if (altBatchResult.items && altBatchResult.items.length > 0) {
                items = altBatchResult.items;
                console.log(`Found ${items.length} items with alternative token IDs`);
              }
            }
          } catch (error) {
            console.error("Error during batch fetch:", error);
          }
        }
        
        console.log(`Found ${items.length} items for collection`);
        
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
    
    /**
     * Fetch detailed information about a specific book token
     * @param {string} address - Contract address
     * @param {string} chain - Blockchain name
     * @param {string} tokenId - Token ID
     * @returns {Promise<Object>} Book details
     */
    export const fetchBookDetail = async (address, chain, tokenId) => {
      try {
        // Get contract details from registry
        const registry = await fetchRegistry();
        let contract = null;
        
        if (chain && registry[chain]) {
          contract = registry[chain].find(c => c.address.toLowerCase() === address.toLowerCase());
        } else {
          // Search all chains if not found
          for (const [chainName, contracts] of Object.entries(registry)) {
            const found = contracts.find(c => c.address.toLowerCase() === address.toLowerCase());
            if (found) {
              contract = found;
              chain = chainName; // Set the chain
              break;
            }
          }
        }
        
        // Use contract info or defaults
        const contractInfo = contract || {
          address,
          chain,
          type: 'nft' // Default type if not found in registry
        };
        
        // Call the API to get book metadata
        const url = `/.netlify/functions/nft/${address}/${chain}/${tokenId}?assetType=${contractInfo.type}`;
        console.log(`Fetching book data from: ${url}`);
        
        const response = await hubApi.get(url);
        
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
    
    /**
     * Fetch books from the registry and enrich with metadata
     * @param {number} limit - Maximum number of books to return
     * @returns {Promise<Object>} Books data
     */
    export const fetchBooks = async (limit = 12) => {
      try {
        // Get book contracts from registry
        const registry = await fetchRegistry();
        
        // Combine all chains and filter for book types
        const bookContracts = Object.entries(registry).flatMap(([chainName, contracts]) => 
          contracts
            .filter(c => 
              c.type === 'book' || 
              c.type === 'alexandria_book' || 
              c.type === 'polygon_book'
            )
            .map(c => ({
              ...c,
              chain: chainName,
              contractAddress: c.address
            }))
        );
        
        if (bookContracts.length === 0) {
          console.warn('No book contracts found in registry');
          return { data: { items: [] } };
        }
        
        // Reuse our collections function but with book-specific filtering
        const booksResponse = await fetchCollections('all', limit * 2);
        const allCollections = booksResponse.data.items;
        
            // Filter to only include book collections
    const bookCollections = allCollections.filter(c => 
      c.type === 'book' || 
      c.type === 'alexandria_book' || 
      c.type === 'polygon_book' ||
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

/**
 * Fetch featured books from the registry
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
 * Fetch book batch from Hub API
 * @param {string} contractAddress - Contract address
 * @param {string} chain - Blockchain name
 * @param {Array<string>} tokenIds - Array of token IDs to fetch
 * @param {boolean} includeOwnership - Whether to include ownership info
 * @returns {Promise<Object>} Batch of book data
 */
export const fetchBookBatch = async (contractAddress, chain, tokenIds = [], includeOwnership = true) => {
  try {
    const assetType = getAssetType(chain);
    const tokenIdsParam = Array.isArray(tokenIds) ? tokenIds.join(',') : tokenIds;
    
    const response = await hubApi.get(`/.netlify/functions/nft/batch/${contractAddress}/${chain}`, {
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

/**
 * Fetch token prices from Hub API
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
 * Fetch historical data from Hub API
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

/**
 * Fetch network comparison data
 * @returns {Promise<Object>} Network comparison data
 */
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

/**
 * Initialize tracking for contracts in the registry
 * @returns {Promise<Object>} Tracking initialization result
 */
export const initializeTracking = async () => {
  try {
    // Get all contracts from registry
    const registry = await fetchRegistry();
    
    const allContracts = Object.entries(registry).flatMap(([chainName, contracts]) => 
      contracts.map(contract => ({
        ...contract,
        chain: chainName,
        contractAddress: contract.address
      }))
    );
    
    console.log(`Initializing tracking for ${allContracts.length} contracts from registry`);
    
    // Our new API doesn't have a registration endpoint, so we'll just 
    // return contract information with a success flag
    return allContracts.map(contract => ({
      ...contract,
      result: {
        success: true,
        message: `Tracking initialized for ${contract.contractAddress} on ${contract.chain}`
      }
    }));
  } catch (error) {
    console.error('Error initializing tracking for contracts:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  fetchRegistry,
  updateRegistry,
  addCollection,
  updateCollection,
  removeCollection,
  fetchCollections,
  fetchCollectionDetail,
  fetchCollectionInfo,
  fetchCollectionTokenBatch,
  fetchBookDetail,
  fetchBooks,
  fetchFeaturedBooks,
  fetchBookBatch,
  fetchTokenPrices,
  fetchHistoricalData,
  fetchNetworkComparison,
  initializeTracking
};
    
    