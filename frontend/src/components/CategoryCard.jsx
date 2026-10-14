import React from 'react';
import { Link } from 'react-router-dom';
import CategoryIcon from './CategoryIcon';

const CategoryCard = ({ category }) => {
  if (!category) return null;

  return (
    <Link
      to={`/books?cat=${category.id}`}
      className="category-card animate-fade-up"
      style={{ textDecoration: 'none' }}
    >
      <div className="cat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '48px', color: 'var(--accent, #8b5cf6)' }}>
        <CategoryIcon name={category.name} icon={category.icon} size={36} />
      </div>
      <div className="cat-name">{category.name}</div>
      <div className="cat-count">{category.count !== undefined ? `${category.count} books` : 'Browse collection'}</div>
    </Link>
  );
};

export default CategoryCard;
