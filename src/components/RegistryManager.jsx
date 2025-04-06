// src/components/RegistryManager.jsx
import React, { useState, useEffect } from 'react';
import { 
  fetchRegistry, 
  updateRegistry
} from '../services/registryApiClient';

const RegistryManager = () => {
  const [registry, setRegistry] = useState({});
  const [selectedChain, setSelectedChain] = useState('all');
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [newCollection, setNewCollection] = useState({
    address: '',
    name: '',
    type: 'book',
    contentType: '',
    creator: '',
    description: '',
    image: '',
    url: ''
  });
  
  // Load the registry on component mount
  useEffect(() => {
    const loadRegistry = async () => {
      try {
        setLoading(true);
        const data = await fetchRegistry();
        setRegistry(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading registry:', err);
        setError('Failed to load registry. Please try again later.');
        setLoading(false);
      }
    };
    
    loadRegistry();
  }, []);
  
  // Update collections when chain or registry changes
  useEffect(() => {
    if (selectedChain === 'all') {
      // Flatten all chains into a single array
      const allCollections = Object.entries(registry).flatMap(([chain, colls]) => 
        colls.map(coll => ({...coll, chain}))
      );
      setCollections(allCollections);
    } else if (registry[selectedChain]) {
      // Add chain name to each collection
      setCollections(registry[selectedChain].map(coll => ({...coll, chain: selectedChain})));
    } else {
      setCollections([]);
    }
  }, [selectedChain, registry]);
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCollection(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle authentication
  const handleAuthenticate = () => {
    // In a real app, you'd validate the API key properly
    if (apiKey.trim().length > 0) {
      setIsAuthenticated(true);
    } else {
      alert('Please enter a valid API key');
    }
  };
  
  // Handle adding a collection
  const handleAddCollection = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('You must authenticate first');
      return;
    }
    
    if (!newCollection.address || !newCollection.name || !newCollection.chain) {
      alert('Address, name, and chain are required fields');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get current registry
      const currentRegistry = await fetchRegistry();
      
      // Ensure the chain exists in the registry
      if (!currentRegistry[newCollection.chain]) {
        currentRegistry[newCollection.chain] = [];
      }
      
      // Add the new collection to the chain
      currentRegistry[newCollection.chain].push({
        address: newCollection.address,
        name: newCollection.name,
        type: newCollection.type,
        contentType: newCollection.contentType,
        creator: newCollection.creator,
        description: newCollection.description,
        image: newCollection.image,
        url: newCollection.url,
        dateAdded: new Date().toISOString()
      });
      
      // Update the registry
      await updateRegistry(currentRegistry, apiKey);
      
      // Refresh the registry
      const updatedRegistry = await fetchRegistry();
      setRegistry(updatedRegistry);
      
      // Reset the form
      setNewCollection({
        address: '',
        name: '',
        type: 'book',
        contentType: '',
        creator: '',
        description: '',
        image: '',
        url: '',
        chain: newCollection.chain
      });
      
      setLoading(false);
      alert('Collection added successfully!');
    } catch (err) {
      console.error('Error adding collection:', err);
      setError('Failed to add collection. Please try again.');
      setLoading(false);
    }
  };
  
  // Handle removing a collection
  const handleRemoveCollection = async (chain, address) => {
    if (!isAuthenticated) {
      alert('You must authenticate first');
      return;
    }
    
    if (window.confirm('Are you sure you want to remove this collection?')) {
      try {
        setLoading(true);
        
        // Get current registry
        const currentRegistry = await fetchRegistry();
        
        // Ensure the chain exists
        if (!currentRegistry[chain]) {
          throw new Error(`Chain ${chain} not found in registry`);
        }
        
        // Filter out the collection to remove
        currentRegistry[chain] = currentRegistry[chain].filter(collection => 
          collection.address.toLowerCase() !== address.toLowerCase()
        );
        
        // Update the registry
        await updateRegistry(currentRegistry, apiKey);
        
        // Refresh the registry
        const updatedRegistry = await fetchRegistry();
        setRegistry(updatedRegistry);
        
        setLoading(false);
        alert('Collection removed successfully!');
      } catch (err) {
        console.error('Error removing collection:', err);
        setError('Failed to remove collection. Please try again.');
        setLoading(false);
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
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Registry Manager</h2>
      
      {/* Authentication Section */}
      {!isAuthenticated && (
        <div className="mb-8 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Authentication</h3>
          <div className="flex items-end gap-4">
            <div className="flex-grow">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">API Key</label>
              <input 
                type="password" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter your API key"
              />
            </div>
            <button 
              onClick={handleAuthenticate}
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Authenticate
            </button>
          </div>
        </div>
      )}
      
      {/* Chain Selector */}
      <div className="mb-6">
        <label className="block text-gray-700 dark:text-gray-300 mb-2">Chain</label>
        <select 
          value={selectedChain} 
          onChange={(e) => setSelectedChain(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="all">All Chains</option>
          <option value="ethereum">Ethereum</option>
          <option value="base">Base</option>
          <option value="optimism">Optimism</option>
          <option value="polygon">Polygon</option>
          <option value="zora">Zora</option>
        </select>
      </div>
      
      {/* Collections Table */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Collections {loading && <span className="ml-2 text-sm text-gray-500">(Loading...)</span>}
        </h3>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        {collections.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No collections found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Name</th>
                  <th className="px-4 py-2 text-left">Address</th>
                  <th className="px-4 py-2 text-left">Chain</th>
                  <th className="px-4 py-2 text-left">Type</th>
                  <th className="px-4 py-2 text-left">Creator</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collections.map((collection, index) => (
                  <tr key={`${collection.chain}-${collection.address}`} className={index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700' : ''}>
                    <td className="px-4 py-2">{collection.name}</td>
                    <td className="px-4 py-2 font-mono text-sm">
                      {collection.address.substring(0, 6)}...{collection.address.substring(collection.address.length - 4)}
                    </td>
                    <td className="px-4 py-2">
                      <span 
                        className="px-2 py-1 rounded-full text-white text-xs"
                        style={{ backgroundColor: getChainColor(collection.chain) }}
                      >
                        {collection.chain}
                      </span>
                    </td>
                    <td className="px-4 py-2">{collection.type}</td>
                    <td className="px-4 py-2">{collection.creator || 'N/A'}</td>
                    <td className="px-4 py-2">
                      {isAuthenticated && (
                        <button 
                          onClick={() => handleRemoveCollection(collection.chain, collection.address)}
                          className="text-red-600 hover:text-red-800"
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
      
      {/* Add Collection Form */}
      {isAuthenticated && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Add Collection</h3>
          <form onSubmit={handleAddCollection}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Chain</label>
                <select 
                  name="chain" 
                  value={newCollection.chain || ''} 
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Select Chain</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                  <option value="polygon">Polygon</option>
                  <option value="zora">Zora</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">Type</label>
                <select 
                  name="type" 
                  value={newCollection.type} 
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="book">Book</option>
                  <option value="alexandria-book">Alexandria Book</option>
                  <option value="publication">Publication</option>
                  <option value="nft">NFT</option>
                  <option value="zora_nft">Zora NFT</option>
                </select>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Contract Address</label>
              <input 
                type="text" 
                name="address" 
                value={newCollection.address} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="0x..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <input 
                type="text" 
                name="name" 
                value={newCollection.name} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Collection name"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Content Type</label>
              <input 
                type="text" 
                name="contentType" 
                value={newCollection.contentType} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="novel, blog, anthology, etc."
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Creator</label>
              <input 
                type="text" 
                name="creator" 
                value={newCollection.creator} 
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                placeholder="Creator name"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Description</label>
              <textarea 
                                name="description" 
                                value={newCollection.description} 
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                placeholder="Collection description"
                                rows={3}
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-gray-700 dark:text-gray-300 mb-2">Image URL</label>
                              <input 
                                type="text" 
                                name="image" 
                                value={newCollection.image} 
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                placeholder="https://..."
                              />
                            </div>
                            
                            <div className="mb-4">
                              <label className="block text-gray-700 dark:text-gray-300 mb-2">Website URL</label>
                              <input 
                                type="text" 
                                name="url" 
                                value={newCollection.url} 
                                onChange={handleInputChange}
                                className="w-full p-2 border rounded"
                                placeholder="https://..."
                              />
                            </div>
                            
                            <button 
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded"
                              disabled={loading}
                            >
                              {loading ? 'Adding...' : 'Add Collection'}
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                };
                
                export default RegistryManager;
                