export const fetchAllBooks = async () => {
  // Get all contracts from registry
  const contracts = getContracts('all');
  
  // Group contracts by collection type
  const alexandriaContracts = contracts.filter(c => 
    c.type === 'alexandria_book' || 
    (c.chain === 'base' && c.name?.includes('Alexandria'))
  );
  
  const readmeContracts = contracts.filter(c => 
    c.type === 'book' && c.chain === 'polygon'
  );
  
  // For Alexandria: each contract is one book, fetch metadata for each
  const alexandriaPromises = alexandriaContracts.map(async contract => {
    try {
      // We just need one token since they're all the same book
      const bookData = await fetchBookDetail(contract.address, contract.chain, '1');
      return {
        ...bookData,
        contractAddress: contract.address,
        chain: contract.chain,
        isAlexandria: true
      };
    } catch (error) {
      console.error(`Error fetching Alexandria book ${contract.address}:`, error);
      return null;
    }
  });
  
  // For Readme: fetch the collection and extract all books
  const readmePromises = readmeContracts.map(async contract => {
    try {
      const collectionData = await fetchCollectionDetail(contract.address, contract.chain);
      return collectionData.data.items.map(item => ({
        ...item,
        contractAddress: contract.address,
        chain: contract.chain,
        isReadme: true,
        tokenId: item.tokenId
      }));
    } catch (error) {
      console.error(`Error fetching Readme books ${contract.address}:`, error);
      return [];
    }
  });
  
  // Resolve all promises
  const alexandriaBooks = (await Promise.all(alexandriaPromises)).filter(Boolean);
  const readmeBooks = (await Promise.all(readmePromises))
    .flat()
    .filter(Boolean);
  
  // Combine all books
  const allBooks = [...alexandriaBooks, ...readmeBooks];
  
  // Now you can sort by metadata fields
  return allBooks.sort((a, b) => a.title.localeCompare(b.title));
};
