import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from './BookCover';

const PublishersSection = ({ books = [] }) => {
  const navigate = useNavigate();

  // Extract unique publishers with representative real book covers
  const publishersMap = new Map();

  books.forEach((b) => {
    const pubName = (b.publisher || '').trim();
    if (pubName && pubName.toLowerCase() !== 'unknown' && pubName !== 'BookVerse Publishing') {
      if (!publishersMap.has(pubName)) {
        publishersMap.set(pubName, {
          name: pubName,
          count: 1,
          representativeBook: b,
        });
      } else {
        const item = publishersMap.get(pubName);
        item.count += 1;
      }
    }
  });

  const publishers = Array.from(publishersMap.values()).slice(0, 4);

  // If no publishers or very few, don't show an empty or fabricated section
  if (publishers.length === 0) return null;

  return (
    <section className="publishers-section">
      <div className="container">
        <div className="editorial-section-header">
          <h2 className="editorial-section-title">Publishers</h2>
          <Link to="/books" className="editorial-see-more">
            <span>See More</span>
            <span>→</span>
          </Link>
        </div>

        <div className="publishers-grid">
          {publishers.map((pub) => {
            const b = pub.representativeBook;
            return (
              <div
                key={pub.name}
                className="publisher-card"
                onClick={() => navigate(`/books?search=${encodeURIComponent(pub.name)}`)}
                title={`Explore publications from ${pub.name}`}
              >
                <div className="publisher-cover-showcase">
                  <BookCover
                    src={b.coverUrl || b.cover}
                    title={b.title}
                    author={b.author}
                    category={b.category}
                    language={b.language}
                    fit="cover"
                    size="md"
                  />
                </div>
                <div className="publisher-meta">
                  <h3 className="publisher-name" title={pub.name}>
                    {pub.name}
                  </h3>
                  <span className="publisher-count">
                    {pub.count} {pub.count === 1 ? 'Book' : 'Books'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PublishersSection;
