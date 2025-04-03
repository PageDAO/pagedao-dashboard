/**
 * Utility functions for handling Alexandria book metadata
 */

/**
 * Extracts book metadata from Alexandria API response
 * @param {Object} data - The API response data
 * @returns {Object} - Extracted metadata
 */
export const extractAlexandriaMetadata = (data) => {
  // Get the metadata object (might be directly in data or nested)
  const metadata = data.metadata || data;
  
  // Extract title from various possible locations
  let title = null;
  if (metadata.name && !metadata.name.includes('Collection')) {
    title = metadata.name.replace(/ #\d+$/, ''); // Remove edition number if present
  } else if (metadata.properties?.title) {
    title = metadata.properties.title;
  } else if (metadata.properties?.work) {
    title = metadata.properties.work;
  } else if (metadata.title) {
    title = metadata.title;
  }
  
  // Extract author
  let author = null;
  if (metadata.properties?.author) {
    author = metadata.properties.author;
  } else if (metadata.attributes) {
    const authorAttr = metadata.attributes.find(
      attr => attr.trait_type === 'Author'
    );
    if (authorAttr) {
      author = authorAttr.value;
    }
  }
  
  // Generate Alexandria reading URL
  let readingUrl = '';
  if (metadata.external_url && metadata.external_url.includes('alexandriabooks.com/collection/')) {
    readingUrl = metadata.external_url;
  } else if (title) {
    // Convert title to URL-friendly slug
    const slug = title.toLowerCase()
      .replace(/[^\w\s-]/g, '') 
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    
    readingUrl = `https://www.alexandriabooks.com/collection/${slug}`;
  }
  
  // Get image URL and convert IPFS to HTTPS
  let imageUrl = metadata.image || '';
  if (imageUrl.startsWith('ipfs://')) {
    imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
  }
  
  // Extract other metadata
  const publisher = metadata.properties?.publisher;
  const pageCount = metadata.properties?.page_count;
  const language = metadata.properties?.language;
  const pubDate = metadata.properties?.publication_date;
  const exoplanet = metadata.attributes?.find(a => a.trait_type === 'Exoplanet')?.value;
  
  return {
    title,
    author,
    description: metadata.description || '',
    imageUrl,
    readingUrl,
    publisher,
    pageCount,
    language,
    publicationDate: pubDate,
    exoplanet
  };
};

/**
 * Determines if a contract is an Alexandria book
 * @param {Object} contract - Contract object with address and chain
 * @returns {Boolean} - True if it's an Alexandria book
 */
export const isAlexandriaBook = (contract) => {
  // Check if it's on Base chain
  if (contract.chain === 'base') {
    // Check known Alexandria contract addresses
    const alexandriaAddresses = [
      '0x233A38EBbb401D41EacC0709E18447dca6b0b634',
      '0x64E2C384738b9Ca2C1820a00B3C2067B8213640e'
    ];
    
    // Case-insensitive check
    return alexandriaAddresses.some(
      addr => addr.toLowerCase() === contract.contractAddress.toLowerCase()
    );
  }
  
  // Check by type
  if (contract.type === 'alexandria_book') {
    return true;
  }
  
  return false;
};
