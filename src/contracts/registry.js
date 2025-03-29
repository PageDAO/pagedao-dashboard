/**
 * PageDAO Hub Contract Registry
 * 
 * Central registry that loads collection contracts from each chain's JSON file.
 * This file serves as the main entry point for accessing the showcase collections.
 */

const path = require('path');
const fs = require('fs');

// Helper function to safely load JSON files
function loadJsonFile(filename) {
  try {
    // Try loading from the direct path first
    const filePath = path.join(__dirname, filename);
    console.log(`Trying to load from: ${filePath}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.warn(`Warning: Could not load ${filename} from direct path:`, error.message);
    
    // If direct path fails, try loading from the project root
    try {
      // Assume registry.js is in the contracts folder at project root
      const projectRoot = path.resolve(__dirname, '..');
      const altPath = path.join(projectRoot, 'contracts', filename);
      console.log(`Trying alternative path: ${altPath}`);
      
      const fileContent = fs.readFileSync(altPath, 'utf8');
      return JSON.parse(fileContent);
    } catch (altError) {
      console.warn(`Also failed with alternative path:`, altError.message);
      
      // One more attempt - look in current working directory
      try {
        const cwdPath = path.join(process.cwd(), 'contracts', filename);
        console.log(`Trying CWD path: ${cwdPath}`);
        
        const fileContent = fs.readFileSync(cwdPath, 'utf8');
        return JSON.parse(fileContent);
      } catch (cwdError) {
        console.warn(`Final attempt failed:`, cwdError.message);
        return [];
      }
    }
  }
}

// Load contract registries for each chain
const contractRegistry = {
  ethereum: loadJsonFile('ethereum.json'),
  base: loadJsonFile('base.json'),
  optimism: loadJsonFile('optimism.json'),
  polygon: loadJsonFile('polygon.json'),
  zora: loadJsonFile('zora.json')
};

/**
 * Get contracts for a specific chain or all chains
 * @param {string} chain - Chain name or 'all' for all chains
 * @returns {Array} Array of contract objects
 */
function getContracts(chain = 'all') {
  if (chain === 'all') {
    // Return all contracts from all chains
    return Object.entries(contractRegistry).reduce((allContracts, [chainName, contracts]) => {
      // Add chain name to each contract object
      const contractsWithChain = contracts.map(contract => ({
        ...contract,
        chain: chainName
      }));
      return [...allContracts, ...contractsWithChain];
    }, []);
  } else if (contractRegistry[chain]) {
    // Return contracts for the specified chain
    return contractRegistry[chain].map(contract => ({
      ...contract,
      chain
    }));
  } else {
    console.warn(`Warning: Chain '${chain}' not found in registry`);
    return [];
  }
}

module.exports = {
  getContracts,
  contractRegistry
};