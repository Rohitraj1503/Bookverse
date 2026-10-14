import React from 'react';
import BookCard from './BookCard';
import SkeletonCard from './SkeletonCard';

const BookGrid = ({ books = [], loading = false, count = 4, className = 'book-grid' }) => {
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
        <div className="empty-icon">📭</div>
        <h3>No books found</h3>
        <p>Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
};

export default BookGrid;
