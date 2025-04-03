/**
 * PageDAO Hub Contract Registry
 * 
 * Frontend registry that manages collection contracts across chains.
 * Provides both pre-populated contracts and ability to add custom contracts.
 */

// Pre-populated contract registries for each chain
// These would be imported from static JSON files in the repo
const predefinedContracts = {
  base: [
    { 
    }
  ],
  optimism: [
    { 
      address: "0xa1b2c3d4e5f67890a1b2c3d4e5f67890", 
      name: "Optimism Books", 
      type: "book",
      description: "Books published on Optimism"
    }
  ],
  polygon: [
    { 
      address: "0x931204Fb8CEA7F7068995dcE924F0d76d571DF99", 
      name: "Readme Books", 
      type: "book",
      description: "Community-curated literature on Polygon"
    }
  ],
  zora: [
    { 
      address: "0xabcdef1234567890abcdef1234567890", 
      name: "Zora Publications", 
      type: "zora_nft",
      description: "NFT books on Zora"
    }
  ]
};

// Initialize with persisted custom contracts from localStorage
const getCustomContracts = () => {
  try {
    const savedContracts = localStorage.getItem('pagedao_custom_contracts');
    return savedContracts ? JSON.parse(savedContracts) : {
      ethereum: [],
      base: [],
      optimism: [],
      polygon: [],
      zora: []
    };
  } catch (error) {
    console.error("Error loading custom contracts:", error);
    return {
      ethereum: [],
      base: [],
      optimism: [],
      polygon: [],
      zora: []
    };
  }
};

// Maintain state for custom contracts
let customContracts = getCustomContracts();

// Create merged registry
const createMergedRegistry = () => {
  const merged = {};
  
  // Initialize with all chain keys
  Object.keys(predefinedContracts).forEach(chain => {
    merged[chain] = [...predefinedContracts[chain]];
  });
  
  // Add custom contracts to each chain
  Object.keys(customContracts).forEach(chain => {
    if (merged[chain]) {
      merged[chain] = [...merged[chain], ...customContracts[chain]];
    } else {
      merged[chain] = [...customContracts[chain]];
    }
  });
  
  return merged;
};

// Create the merged registry
let contractRegistry = createMergedRegistry();

/**
 * Add a custom contract to the registry
 * @param {string} chain - Chain name
 * @param {object} contract - Contract object with address and metadata
 * @returns {boolean} Success indicator
 */
function addCustomContract(chain, contract) {
  if (!chain || !contract || !contract.address) {
    console.error("Invalid contract data");
    return false;
  }
  
  // Initialize chain array if needed
  if (!customContracts[chain]) {
    customContracts[chain] = [];
  }
  
  // Check if contract already exists
  const exists = customContracts[chain].some(c => 
    c.address.toLowerCase() === contract.address.toLowerCase()
  );
  
  if (!exists) {
    // Add timestamp for sorting/filtering
    contract.addedAt = Date.now();
    
    // Add to custom contracts
    customContracts[chain].push(contract);
    
    // Persist to localStorage
    localStorage.setItem('pagedao_custom_contracts', JSON.stringify(customContracts));
    
    // Regenerate merged registry
    contractRegistry = createMergedRegistry();
    return true;
  }
  
  return false;
}

/**
 * Remove a custom contract from the registry
 * @param {string} chain - Chain name
 * @param {string} address - Contract address
 * @returns {boolean} Success indicator
 */
function removeCustomContract(chain, address) {
  if (!chain || !address || !customContracts[chain]) {
    return false;
  }
  
  const initialLength = customContracts[chain].length;
  customContracts[chain] = customContracts[chain].filter(c => 
    c.address.toLowerCase() !== address.toLowerCase()
  );
  
  if (customContracts[chain].length !== initialLength) {
    // Persist to localStorage
    localStorage.setItem('pagedao_custom_contracts', JSON.stringify(customContracts));
    
    // Regenerate merged registry
    contractRegistry = createMergedRegistry();
    return true;
  }
  
  return false;
}

/**
 * Get contracts for a specific chain or all chains
 * @param {string} chain - Chain name or 'all' for all chains
 * @param {object} options - Options for filtering/sorting
 * @returns {Array} Array of contract objects
 */
function getContracts(chain = 'all', options = {}) {
  const { includeCustom = true, includePredefined = true, sortBy = 'name' } = options;
  
  if (chain === 'all') {
    // Return all contracts from all chains
    return Object.entries(contractRegistry).reduce((allContracts, [chainName, contracts]) => {
      // Filter based on options
      let filteredContracts = contracts;
      
      if (!includeCustom) {
        filteredContracts = filteredContracts.filter(c => !c.addedAt);
      }
      
      if (!includePredefined) {
        filteredContracts = filteredContracts.filter(c => c.addedAt);
      }
      
      // Add chain name to each contract object
      const contractsWithChain = filteredContracts.map(contract => ({
        ...contract,
        chain: chainName
      }));
      
      return [...allContracts, ...contractsWithChain];
    }, []);
  } else if (contractRegistry[chain]) {
    // Return contracts for the specified chain
    let filteredContracts = contractRegistry[chain];
    
    if (!includeCustom) {
      filteredContracts = filteredContracts.filter(c => !c.addedAt);
    }
    
    if (!includePredefined) {
      filteredContracts = filteredContracts.filter(c => c.addedAt);
    }
    
    return filteredContracts.map(contract => ({
      ...contract,
      chain
    }));
  } else {
    console.warn(`Warning: Chain '${chain}' not found in registry`);
    return [];
  }
}

/**
 * Get contract details by address
 * @param {string} address - Contract address
 * @param {string} chain - Optional chain to search (faster)
 * @returns {object|null} Contract details or null if not found
 */
function getContractByAddress(address, chain = null) {
  if (!address) return null;
  
  const normalizedAddress = address.toLowerCase();
  
  if (chain && contractRegistry[chain]) {
    const found = contractRegistry[chain].find(c => 
      c.address.toLowerCase() === normalizedAddress
    );
    
    if (found) {
      return {
        ...found,
        chain
      };
    }
  } else {
    // Search all chains
    for (const [chainName, contracts] of Object.entries(contractRegistry)) {
      const found = contracts.find(c => 
        c.address.toLowerCase() === normalizedAddress
      );
      
      if (found) {
        return {
          ...found,
          chain: chainName
        };
      }
    }
  }
  
  return null;
}

export {
  getContracts,
  getContractByAddress,
  addCustomContract,
  removeCustomContract,
  contractRegistry
};