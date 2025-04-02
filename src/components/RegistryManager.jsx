import React, { useState, useEffect } from 'react';
import { 
  getContracts, 
  addCustomContract, 
  removeCustomContract 
} from '../contracts/registry';

const RegistryManager = () => {
  const [contracts, setContracts] = useState([]);
  const [selectedChain, setSelectedChain] = useState('all');
  const [newContract, setNewContract] = useState({
    address: '',
    name: '',
    type: 'book',
    description: '',
    chain: 'ethereum'
  });
  
  // Load contracts on mount and when chain changes
  useEffect(() => {
    setContracts(getContracts(selectedChain));
  }, [selectedChain]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewContract(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!newContract.address || !newContract.name) {
      alert('Address and name are required');
      return;
    }
    
    const success = addCustomContract(newContract.chain, {
      address: newContract.address,
      name: newContract.name,
      type: newContract.type,
      description: newContract.description
    });
    
    if (success) {
      // Reset form
      setNewContract({
        address: '',
        name: '',
        type: 'book',
        description: '',
        chain: 'ethereum'
      });
      
      // Refresh contracts list
      setContracts(getContracts(selectedChain));
    } else {
      alert('Contract already exists in registry');
    }
  };
  
  // Handle contract removal
  const handleRemove = (chain, address) => {
    if (window.confirm('Are you sure you want to remove this contract?')) {
      const success = removeCustomContract(chain, address);
      
      if (success) {
        // Refresh contracts list
        setContracts(getContracts(selectedChain));
      }
    }
  };

  // Get chain color for visual indicators
  const getChainColor = (chain) => {
    const colors = {
      ethereum: '#6F7CBA',
      optimism: '#FF0420',
      base: '#0052FF',
      polygon: '#8247E5',
      zora: '#5E12A0'
    };
    return colors[chain] || '#4dabf7';
  };
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Contract Registry Manager</h2>
      
      <div className="mb-8">
        <label className="block text-gray-700 dark:text-gray-200 mb-2 font-medium">
          Select Chain:
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(e.target.value)}
            className="block w-full md:w-64 mt-1 rounded-md border-gray-300 dark:border-gray-600 
                       shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                       focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Chains</option>
            <option value="ethereum">Ethereum</option>
            <option value="base">Base</option>
            <option value="optimism">Optimism</option>
            <option value="polygon">Polygon</option>
            <option value="zora">Zora</option>
          </select>
        </label>
      </div>
      
      <div className="mb-10">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Registered Contracts</h3>
        {contracts.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-gray-500 dark:text-gray-300">No contracts found for this chain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Chain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {contracts.map((contract) => (
                  <tr key={`${contract.chain}-${contract.address}`} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 dark:text-white font-medium">
                      {contract.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <a 
                        href={`https://${contract.chain === 'ethereum' ? '' : contract.chain + '.'}etherscan.io/address/${contract.address}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm"
                      >
                        {contract.address.substring(0, 6)}...{contract.address.substring(38)}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" 
                            style={{ backgroundColor: getChainColor(contract.chain), color: 'white' }}>
                        {contract.chain}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                      {contract.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contract.addedAt && (
                        <button 
                          onClick={() => handleRemove(contract.chain, contract.address)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 
                                    font-medium hover:underline focus:outline-none"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Custom Contract</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                Chain:
                <select 
                  name="chain" 
                  value={newContract.chain} 
                  onChange={handleInputChange}
                  className="block w-full mt-1 rounded-md border-gray-300 dark:border-gray-600 
                           shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                           focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                  <option value="polygon">Polygon</option>
                  <option value="zora">Zora</option>
                </select>
              </label>
            </div>
            
            <div>
              <label className="block text-gray-700 dark:text-gray-200 mb-2">
                Type:
                <select 
                  name="type" 
                  value={newContract.type} 
                  onChange={handleInputChange}
                  className="block w-full mt-1 rounded-md border-gray-300 dark:border-gray-600 
                           shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                           focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="book">Book</option>
                  <option value="alexandria_book">Alexandria Book</option>
                  <option value="mirror_publication">Mirror Publication</option>
                  <option value="zora_nft">Zora NFT</option>
                  <option value="polygon_book">Polygon Book</option>
                  <option value="nft">Generic NFT</option>
                </select>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Contract Address:
              <input 
                type="text" 
                name="address" 
                value={newContract.address} 
                onChange={handleInputChange}
                placeholder="0x..."
                className="block w-full mt-1 rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                         focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
                         font-mono"
                required
              />
            </label>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Collection Name:
              <input 
                type="text" 
                name="name" 
                value={newContract.name} 
                onChange={handleInputChange}
                placeholder="Collection Name"
                className="block w-full mt-1 rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                         focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </label>
          </div>
          
          <div>
            <label className="block text-gray-700 dark:text-gray-200 mb-2">
              Description:
              <textarea 
                name="description" 
                value={newContract.description} 
                onChange={handleInputChange}
                placeholder="Optional description of the collection"
                rows={3}
                className="block w-full mt-1 rounded-md border-gray-300 dark:border-gray-600 
                         shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 
                         focus:ring-opacity-50 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </label>
          </div>
          
          <div className="flex justify-end">
            <button 
              type="submit" 
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md 
                       shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
                       transition-colors duration-150"
            >
              Add Contract
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegistryManager;