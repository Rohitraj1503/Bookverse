import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="book-card">
      <div className="skeleton skeleton-img"></div>
      <div className="card-body">
        <div className="skeleton skeleton-text" style={{ width: '40%' }}></div>
        <div className="skeleton skeleton-title"></div>
        <div className="skeleton skeleton-text" style={{ width: '60%' }}></div>
        <div className="skeleton skeleton-text" style={{ width: '50%', marginTop: '16px' }}></div>
      </div>
    </div>
  );
};

export default SkeletonCard;
