import React, { useState, useEffect } from 'react';
import { fetchAllBooks } from '../services/bookService';

function AllBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('title');
  const [filterBy, setFilterBy] = useState('all');
  
  useEffect(() => {
    async function loadBooks() {
      const allBooks = await fetchAllBooks();
      setBooks(allBooks);
      setLoading(false);
    }
    
    loadBooks();
  }, []);
  
  // Sort the books based on the selected criteria
  const sortedBooks = [...books].sort((a, b) => {
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'author') {
      return (a.additionalData?.author || '').localeCompare(b.additionalData?.author || '');
    }
    // Add more sorting options
    return 0;
  });
  
  // Filter books
  const filteredBooks = sortedBooks.filter(book => {
    if (filterBy === 'all') return true;
    if (filterBy === 'alexandria') return book.isAlexandria;
    if (filterBy === 'readme') return book.isReadme;
    // Add more filters
    return true;
  });
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        Discover Books
      </h1>
      
      {/* Filter controls */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Sort by
          </label>
          <select 
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="title">Title</option>
            <option value="author">Author</option>
            <option value="date">Publication Date</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Platform
          </label>
          <select 
            value={filterBy}
            onChange={e => setFilterBy(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
          >
            <option value="all">All Platforms</option>
            <option value="alexandria">Alexandria</option>
            <option value="readme">Readme</option>
          </select>
        </div>
      </div>
      
      {/* Book grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBooks.map(book => (
            <div 
              key={`${book.chain}-${book.contractAddress}-${book.tokenId || '1'}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden"
            >
              <img 
                src={book.imageURI || '/images/placeholder-cover.png'} 
                alt={book.title} 
                className="w-full h-48 object-cover"
              />
              
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                  {book.title}
                </h3>
                
                {book.additionalData?.author && (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    by {book.additionalData.author}
                  </p>
                )}
                
                <div className="mt-3 flex justify-between items-center">
                  <span 
                    className="px-2 py-1 text-xs font-semibold rounded"
                    style={{ 
                      backgroundColor: book.isAlexandria ? '#0052FF' : '#8247E5',
                      color: 'white'
                    }}
                  >
                    {book.isAlexandria ? 'Alexandria' : 'Readme'}
                  </span>
                  
                  <a 
                    href={book.isAlexandria 
                      ? `/book/${book.contractAddress}?chain=${book.chain}` 
                      : `/collections/${book.contractAddress}/book/${book.tokenId}?chain=${book.chain}`}
                    className="text-blue-500 hover:text-blue-700"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AllBooks;
