import React, { useState, useEffect } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

/**
 * BookCover Component
 * Renders authentic book covers with object-fit: contain/cover,
 * and seamlessly falls back to a Midnight Purple BookVerse styled cover
 * if the image fails, is missing, or is a generic placeholder.
 *
 * Prevents infinite error loops and guarantees no grey broken rectangles.
 */
export const BookCover = ({
  src,
  title = 'Untitled Book',
  author = 'BookVerse Author',
  category = '',
  language = '',
  className = '',
  style = {},
  imgStyle = {},
  fit = 'contain',
  size = 'md', // 'sm' (admin table/cart), 'md' (card), 'lg' (detail)
  loading = 'lazy',
}) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  // Check if image URL is invalid, empty, or placeholder.com
  const isPlaceholderUrl = !src || typeof src !== 'string' || src.trim() === '' || src.includes('via.placeholder.com');

  // Reset error state when src changes
  useEffect(() => {
    setImgError(false);
    setImgLoaded(false);
  }, [src]);

  const shouldShowFallback = isPlaceholderUrl || imgError;

  if (shouldShowFallback) {
    // Generate subtle deterministic hue variation based on title
    const hash = (title || '').split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradientChoice = hash % 3;
    const gradients = [
      'linear-gradient(145deg, #18152e 0%, #0d0f1a 100%)',
      'linear-gradient(145deg, #1b1633 0%, #0b0c16 100%)',
      'linear-gradient(145deg, #14182b 0%, #090b14 100%)',
    ];

    const isSmall = size === 'sm';
    const isLarge = size === 'lg';

    return (
      <div
        className={`bookverse-fallback-cover ${className}`}
        style={{
          width: '100%',
          height: '100%',
          aspectRatio: '2 / 3',
          background: gradients[gradientChoice],
          borderRadius: isSmall ? '4px' : '8px',
          boxShadow: isSmall
            ? '0 2px 8px rgba(0,0,0,0.4)'
            : '0 8px 24px rgba(0,0,0,0.5), inset 3px 0 6px rgba(0,0,0,0.4), inset -1px 0 0 rgba(255,255,255,0.06)',
          border: '1px solid rgba(139, 92, 246, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: isSmall ? '6px' : isLarge ? '24px' : '14px',
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          ...style,
        }}
        title={`${title} by ${author}`}
      >
        {/* Book Spine Accent Line on Left */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: isSmall ? '3px' : '6px',
            background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.6), rgba(56, 189, 248, 0.3))',
            boxShadow: '1px 0 3px rgba(0,0,0,0.4)',
          }}
        />

        {/* Top Header: BookVerse Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: isSmall ? '2px' : '4px' }}>
            <BookOpen size={isSmall ? 10 : isLarge ? 16 : 12} color="#8b5cf6" />
            {!isSmall && (
              <span
                style={{
                  fontSize: isLarge ? '0.72rem' : '0.62rem',
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  color: '#8b5cf6',
                  textTransform: 'uppercase',
                }}
              >
                BookVerse
              </span>
            )}
          </div>
          {language && !isSmall && (
            <span
              style={{
                fontSize: '0.6rem',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'rgba(56, 189, 248, 0.12)',
                color: '#38bdf8',
                fontWeight: 600,
              }}
            >
              {language}
            </span>
          )}
        </div>

        {/* Center: Title & Category */}
        <div
          style={{
            textAlign: 'center',
            padding: isSmall ? '0 2px' : '8px 4px',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            flex: 1,
          }}
        >
          {category && !isSmall && (
            <span
              style={{
                fontSize: isLarge ? '0.75rem' : '0.65rem',
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '4px',
                fontWeight: 600,
              }}
            >
              {category}
            </span>
          )}
          <h4
            style={{
              margin: 0,
              color: '#f8fafc',
              fontSize: isSmall ? '0.65rem' : isLarge ? '1.25rem' : '0.85rem',
              fontWeight: 700,
              lineHeight: 1.25,
              fontFamily: '"Georgia", "Merriweather", serif',
              display: '-webkit-box',
              WebkitLineClamp: isSmall ? 2 : isLarge ? 4 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              wordBreak: 'break-word',
            }}
          >
            {title}
          </h4>
        </div>

        {/* Bottom: Author */}
        <div
          style={{
            borderTop: isSmall ? 'none' : '1px solid rgba(255,255,255,0.06)',
            paddingTop: isSmall ? 0 : '6px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: isSmall ? '0.55rem' : isLarge ? '0.8rem' : '0.68rem',
              color: '#94a3b8',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {author}
          </p>
        </div>

        {/* Ambient background glow decoration */}
        <div
          style={{
            position: 'absolute',
            bottom: '-20%',
            right: '-20%',
            width: '80%',
            height: '80%',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    );
  }

  // Real cover rendering with smooth fade-in
  return (
    <div
      className={`book-cover-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...style,
      }}
    >
      <img
        src={src}
        alt={title}
        loading={loading}
        onLoad={() => setImgLoaded(true)}
        onError={() => {
          setImgError(true);
        }}
        style={{
          width: fit === 'cover' ? '100%' : 'auto',
          height: fit === 'cover' ? '100%' : '88%',
          maxWidth: fit === 'cover' ? '100%' : '80%',
          objectFit: fit,
          borderRadius: size === 'sm' ? '4px' : '6px',
          filter: 'drop-shadow(0 8px 20px rgba(0, 0, 0, 0.45))',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease',
          opacity: imgLoaded ? 1 : 0.7,
          ...imgStyle,
        }}
      />
    </div>
  );
};

export default BookCover;
