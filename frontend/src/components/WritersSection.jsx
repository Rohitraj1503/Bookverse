import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const WritersSection = ({ books = [] }) => {
  const navigate = useNavigate();

  // Extract unique authors dynamically from the real catalog
  const authorsMap = new Map();
  books.forEach((b) => {
    if (b.author && !authorsMap.has(b.author.trim())) {
      authorsMap.set(b.author.trim(), {
        name: b.author.trim(),
        bookCount: 1,
        sampleCover: b.coverUrl || b.cover,
      });
    } else if (b.author) {
      const existing = authorsMap.get(b.author.trim());
      existing.bookCount += 1;
    }
  });

  const authors = Array.from(authorsMap.values()).slice(0, 10);

  if (authors.length === 0) return null;

  const getInitials = (name) => {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');
  };

  // Distinct elegant dark tones for initials backgrounds
  const avatarColors = [
    'linear-gradient(135deg, #2b2210, #141108)',
    'linear-gradient(135deg, #1c222b, #0c1015)',
    'linear-gradient(135deg, #291c2b, #130a14)',
    'linear-gradient(135deg, #1d2b1f, #09140b)',
    'linear-gradient(135deg, #2b1f1c, #140b08)',
  ];

  return (
    <section className="writers-section">
      <div className="container">
        <div className="editorial-section-header">
          <h2 className="editorial-section-title">Writers</h2>
          <Link to="/books" className="editorial-see-more">
            <span>See More</span>
            <span>→</span>
          </Link>
        </div>

        <div className="writers-row">
          {authors.map((author, idx) => (
            <div
              key={author.name}
              className="writer-card"
              onClick={() => navigate(`/books?search=${encodeURIComponent(author.name)}`)}
              title={`Explore books by ${author.name}`}
            >
              <div className="writer-avatar-wrap">
                <div
                  className="writer-avatar"
                  style={{ background: avatarColors[idx % avatarColors.length] }}
                >
                  {getInitials(author.name)}
                </div>
              </div>
              <span className="writer-name" title={author.name}>
                {author.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WritersSection;
