import React, { useRef } from 'react';

const CategoryPillNav = ({
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -220, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 220, behavior: 'smooth' });
    }
  };

  return (
    <div className="category-pill-nav">
      <button
        className="pill-arrow-btn"
        onClick={scrollLeft}
        aria-label="Scroll categories left"
        type="button"
      >
        ‹
      </button>

      <div className="category-pills-scroll" ref={scrollRef}>
        <button
          className={`category-pill ${selectedCategory === 'all' ? 'active' : ''}`}
          onClick={() => onSelectCategory('all')}
          type="button"
        >
          All Category
        </button>

        {categories.map((cat) => {
          const catName = typeof cat === 'string' ? cat : cat.name;
          const catId = typeof cat === 'string' ? cat : cat.id;
          const isSelected = selectedCategory === catId || selectedCategory === catName;

          return (
            <button
              key={catId}
              className={`category-pill ${isSelected ? 'active' : ''}`}
              onClick={() => onSelectCategory(catId)}
              type="button"
            >
              {catName}
            </button>
          );
        })}
      </div>

      <button
        className="pill-arrow-btn"
        onClick={scrollRight}
        aria-label="Scroll categories right"
        type="button"
      >
        ›
      </button>
    </div>
  );
};

export default CategoryPillNav;
