// src/components/nft/CollectionGrid.jsx
import React, { useState, useEffect } from 'react';
import { fetchCollections } from '../../services/api';
import NFTCard from './NFTCard';

function CollectionGrid({ chain = 'all', limit = 12 }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetchCollections(chain, limit);
        setCollections(response.data.items);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError(err.message || 'Failed to fetch collections');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [chain, limit]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }
  
  if (!collections || collections.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No collections found for this chain.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {collections.map((collection) => (
        <NFTCard key={`${collection.chain}-${collection.contractAddress}`} collection={collection} />
      ))}
    </div>
  );
}

export default CollectionGrid;