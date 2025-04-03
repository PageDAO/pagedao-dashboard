// Create a new utils file for formatting functions

export const formatNftItem = (item) => {
  return {
    id: item.id || `${item.contractAddress}-${item.tokenId}`,
    title: item.title || `Untitled #${item.tokenId}`,
    description: item.description || '',
    imageURI: item.imageURI || '',
    contentURI: item.contentURI || '',
    metadataURI: item.metadataURI || '',
    tokenId: item.tokenId,
    chain: item.chain,
    contractAddress: item.contractAddress,
    creator: item.creator || '',
    owner: item.owner || '',
    format: item.format || 'unknown',
    additionalData: item.additionalData || {}
  };
};

export const formatCollection = (collection) => {
  return {
    name: collection.name || 'Unnamed Collection',
    description: collection.description || '',
    chain: collection.chain,
    contractAddress: collection.contractAddress,
    totalSupply: collection.totalSupply || 0,
    type: collection.type || 'book',
    imageURI: collection.imageURI || ''
  };
};
