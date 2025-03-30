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
  
  return (
    <div className="registry-manager">
      <h2>Contract Registry Manager</h2>
      
      <div className="chain-selector">
        <label>
          Chain:
          <select 
            value={selectedChain} 
            onChange={(e) => setSelectedChain(e.target.value)}
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
      
      <div className="contracts-list">
        <h3>Registered Contracts</h3>
        {contracts.length === 0 ? (
          <p>No contracts found for this chain.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Chain</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={`${contract.chain}-${contract.address}`}>
                  <td>{contract.name}</td>
                  <td>
                    <a 
                      href={`https://etherscan.io/address/${contract.address}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {contract.address.substring(0, 6)}...{contract.address.substring(38)}
                    </a>
                  </td>
                  <td>{contract.chain}</td>
                  <td>{contract.type}</td>
                  <td>
                    {contract.addedAt && (
                      <button 
                        onClick={() => handleRemove(contract.chain, contract.address)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      <div className="add-contract-form">
        <h3>Add Custom Contract</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>
              Chain:
              <select 
                name="chain" 
                value={newContract.chain} 
                onChange={handleInputChange}
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
          
          <div className="form-group">
            <label>
              Address:
              <input 
                type="text" 
                name="address" 
                value={newContract.address} 
                onChange={handleInputChange}
                placeholder="0x..."
                required
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              Name:
              <input 
                type="text" 
                name="name" 
                value={newContract.name} 
                onChange={handleInputChange}
                placeholder="Contract Name"
                required
              />
            </label>
          </div>
          
          <div className="form-group">
            <label>
              Type:
              <select 
                name="type" 
                value={newContract.type} 
                onChange={handleInputChange}
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
          
          <div className="form-group">
            <label>
              Description:
              <textarea 
                name="description" 
                value={newContract.description} 
                onChange={handleInputChange}
                placeholder="Optional description of the contract"
              />
            </label>
          </div>
          
          <button type="submit" className="add-btn">Add Contract</button>
        </form>
      </div>
    </div>
  );
};

export default RegistryManager;
