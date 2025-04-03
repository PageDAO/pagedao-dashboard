import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { fetchBookDetail } from '../services/api';

function BookDetail() {
  const { address, tokenId } = useParams();
  const [searchParams] = useSearchParams();
  const chain = searchParams.get('chain') || 'ethereum';
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      if (!isMounted) return;
      
      try {
        setLoading(true);
        const bookData = await fetchBookDetail(address, chain, tokenId);
        
        if (isMounted) {
          console.log('Book detail response:', bookData);
          setBook(bookData);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error fetching book detail:', err);
          setError(err.message || 'Failed to fetch book');
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [address, chain, tokenId]);
  
  const getChainColor = (chainName) => {
    const colors = {
      ethereum: '#6F7CBA',
      optimism: '#FF0420',
      base: '#0052FF',
      zora: '#5E12A0',
      polygon: '#8247E5'
    };
    return colors[chainName] || '#4dabf7';
  };
  
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
  
  if (!book) {
    return (
      <div className="text-center text-gray-500 py-8">
        Book not found.
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link to={`/collections/${address}?chain=${chain}`} className="text-blue-500 hover:text-blue-700 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          Back to Collection
        </Link>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="h-2" style={{ backgroundColor: getChainColor(chain) }}></div>
        
        <div className="p-6">
          <div className="flex flex-col md:flex-row">
            {/* Book Cover */}
            <div className="md:w-1/3 mb-6 md:mb-0 md:pr-8">
              <div className="bg-gray-100 dark:bg-gray-900 rounded-lg shadow-md p-2">
                <img 
                  src={book.imageURI || '/images/placeholder-cover.png'} 
                  alt={book.title || `Book #${tokenId}`} 
                  className="w-full rounded-lg object-contain"
                  style={{ maxHeight: '500px' }}
                  onError={(e) => {
                    e.target.src = '/images/placeholder-cover.png';
                  }}
                />
              </div>
              
              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* Use interactive_url if available, fall back to contentURI */}
                {(book.interactive_url || book.contentURI) && (
                  <a 
                    href={book.interactive_url || book.contentURI}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center font-medium"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                    </svg>
                    Readme
                  </a>
                )}
                
                <button 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                >
                  Share
                </button>
              </div>
            </div>
            
            {/* Book Details */}
            <div className="md:w-2/3">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                    {book.title || `Book #${tokenId}`}
                  </h1>
                  
                  <div className="flex items-center mb-4">
                    <span 
                      className="px-2 py-1 text-xs font-semibold rounded text-white mr-2"
                      style={{ backgroundColor: getChainColor(chain) }}
                    >
                      {chain.charAt(0).toUpperCase() + chain.slice(1)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      Token ID: {tokenId}
                    </span>
                  </div>
                </div>
                
                {/* Add to Favorites Button (placeholder) */}
                <button className="text-gray-400 hover:text-yellow-500">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                  </svg>
                </button>
              </div>
              
              {/* Author/Creator */}
              {book.additionalData?.author && (
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    By {book.additionalData.author}
                  </h2>
                </div>
              )}
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Description</h3>
                <div className="prose dark:prose-dark max-w-none text-gray-600 dark:text-gray-300">
                  {book.description ? (
                    <p>{book.description}</p>
                  ) : (
                    <p className="italic text-gray-500">No description available.</p>
                  )}
                </div>
              </div>
              
              {/* Book Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Format */}
                {book.format && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Format</h3>
                    <p className="text-gray-800 dark:text-white">{book.format}</p>
                  </div>
                )}
                
                {/* Creator/Publisher */}
                {book.creator && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Creator</h3>
                    <p className="text-gray-800 dark:text-white truncate">{book.creator}</p>
                  </div>
                )}
                
                {/* Publication Date */}
                {book.createdAt && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Publication Date</h3>
                    <p className="text-gray-800 dark:text-white">
                      {new Date(book.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
                
                {/* Publisher */}
                {book.additionalData?.publisher && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Publisher</h3>
                    <p className="text-gray-800 dark:text-white">{book.additionalData.publisher}</p>
                  </div>
                )}
                
                {/* Page Count */}
                {book.additionalData?.pageCount && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pages</h3>
                    <p className="text-gray-800 dark:text-white">{book.additionalData.pageCount}</p>
                  </div>
                )}
                
                {/* Language */}
                {book.additionalData?.language && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Language</h3>
                    <p className="text-gray-800 dark:text-white">{book.additionalData.language}</p>
                  </div>
                )}
                
                {/* Dynamic rendering of any other additional data */}
                {book.additionalData && Object.entries(book.additionalData)
                  .filter(([key]) => !['author', 'publisher', 'pageCount', 'language'].includes(key))
                  .map(([key, value]) => (
                    typeof value !== 'object' && value ? (
                      <div key={key}>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                        </h3>
                        <p className="text-gray-800 dark:text-white">{value.toString()}</p>
                      </div>
                    ) : null
                  ))
                }
                {/* Add this to the Book Details Grid section */}
                {book.contentURI && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Content URL</h3>
                    <a 
                      href={book.contentURI}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 text-sm break-all"
                    >
                      {book.contentURI}
                    </a>
                  </div>
                )}
              </div>
              
                            {/* NFT Details */}
                            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                  NFT Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Contract Address</h3>
                    <a 
                      href={`https://${chain === 'ethereum' ? '' : chain + '.'}etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 font-mono text-sm truncate block"
                    >
                      {address}
                    </a>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Token ID</h3>
                    <p className="text-gray-800 dark:text-white font-mono">{tokenId}</p>
                  </div>
                  
                  {book.owner && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Owner</h3>
                      <a 
                        href={`https://${chain === 'ethereum' ? '' : chain + '.'}etherscan.io/address/${book.owner}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 font-mono text-sm truncate block"
                      >
                        {book.owner}
                      </a>
                    </div>
                  )}
                  
                  {book.metadataURI && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Metadata</h3>
                      <a 
                        href={book.metadataURI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700 text-sm truncate block"
                      >
                        View Metadata
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Optional: Related Books Section */}
      {/* This could be implemented later to show other books from the same collection */}
    </div>
  );
}

export default BookDetail;
