import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getContracts, 
  getContractByAddress,
  addCustomContract, 
  removeCustomContract 
} from '../contracts/registry';

// Create context
const RegistryContext = createContext();

// Provider component
export const RegistryProvider = ({ children }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Initialize contracts
  useEffect(() => {
    setContracts(getContracts('all'));
    setLoading(false);
  }, [lastUpdate]);

  // Function to refresh contracts
  const refreshContracts = () => {
    setLastUpdate(Date.now());
  };

  // Function to add custom contract
  const addContract = (chain, contract) => {
    const success = addCustomContract(chain, contract);
    if (success) {
      refreshContracts();
    }
    return success;
  };

  // Function to remove custom contract
  const removeContract = (chain, address) => {
    const success = removeCustomContract(chain, address);
    if (success) {
      refreshContracts();
    }
    return success;
  };

  // Get filtered contracts
  const getFilteredContracts = (chain = 'all', options = {}) => {
    return getContracts(chain, options);
  };

  // Get contract by address
  const findContractByAddress = (address, chain = null) => {
    return getContractByAddress(address, chain);
  };

  // Create value object
  const value = {
    contracts,
    loading,
    refreshContracts,
    addContract,
    removeContract,
    getFilteredContracts,
    findContractByAddress
  };

  return (
    <RegistryContext.Provider value={value}>
      {children}
    </RegistryContext.Provider>
  );
};

// Custom hook for using the registry
export const useRegistry = () => {
  const context = useContext(RegistryContext);
  if (context === undefined) {
    throw new Error('useRegistry must be used within a RegistryProvider');
  }
  return context;
};
