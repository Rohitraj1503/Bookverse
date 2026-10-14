/**
 * Formatting and utility helpers for BookVerse
 */

export function formatPrice(price) {
  if (price === undefined || price === null || isNaN(Number(price))) {
    return '₹0.00';
  }
  return '₹' + Number(price).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function getDiscountPercent(original, current) {
  if (!original || original <= current) return 0;
  return Math.round(((original - current) / original) * 100);
}

export function getInitials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function getFallbackMockCategories() {
  return [
    { id: 1, name: 'Fiction', icon: '📖', count: 12 },
    { id: 2, name: 'Non-Fiction', icon: '📚', count: 8 },
    { id: 3, name: 'Science & Technology', icon: '🔬', count: 15 },
    { id: 4, name: 'Business & Economics', icon: '💼', count: 9 },
    { id: 5, name: 'Self-Help', icon: '🌟', count: 14 },
    { id: 6, name: 'Children & Young Adult', icon: '🧒', count: 6 },
    { id: 7, name: 'History', icon: '🏛️', count: 11 }
  ];
}

export function getFallbackMockBooks() {
  return [
    {
      id: 1,
      title: 'The Midnight Library',
      author: 'Matt Haig',
      description: 'Between life and death there is a library, and within that library, the shelves go on forever.',
      price: 1199.20,
      originalPrice: 1599.20,
      stock: 45,
      categoryId: 1,
      category: 'Fiction',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1602190253i/52578297.jpg',
      rating: 4.2,
      reviews: 1420,
      pages: 288,
      publisher: 'Viking',
      year: 2020,
      isFeatured: true
    },
    {
      id: 2,
      title: 'Atomic Habits',
      author: 'James Clear',
      description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones.',
      price: 1359.20,
      originalPrice: 1999.20,
      stock: 120,
      categoryId: 5,
      category: 'Self-Help',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1655988385i/40121378.jpg',
      rating: 4.8,
      reviews: 3200,
      pages: 320,
      publisher: 'Avery',
      year: 2018,
      isFeatured: true
    },
    {
      id: 3,
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      description: 'From a renowned historian comes a groundbreaking narrative of humanitys creation and evolution.',
      price: 1519.20,
      originalPrice: 2240.00,
      stock: 85,
      categoryId: 2,
      category: 'Non-Fiction',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1703329519i/23692271.jpg',
      rating: 4.4,
      reviews: 2150,
      pages: 443,
      publisher: 'Harper',
      year: 2014,
      isFeatured: true
    },
    {
      id: 4,
      title: 'Clean Code',
      author: 'Robert C. Martin',
      description: 'A Handbook of Agile Software Craftsmanship.',
      price: 2799.20,
      originalPrice: 3999.20,
      stock: 60,
      categoryId: 3,
      category: 'Science & Technology',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1436202607i/3735293.jpg',
      rating: 4.5,
      reviews: 890,
      pages: 464,
      publisher: 'Prentice Hall',
      year: 2008,
      isFeatured: true
    },
    {
      id: 5,
      title: 'The Psychology of Money',
      author: 'Morgan Housel',
      description: 'Timeless lessons on wealth, greed, and happiness.',
      price: 1279.20,
      originalPrice: 1760.00,
      stock: 95,
      categoryId: 4,
      category: 'Business & Economics',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1581527774i/41881472.jpg',
      rating: 4.6,
      reviews: 1840,
      pages: 256,
      publisher: 'Harriman House',
      year: 2020,
      isFeatured: true
    },
    {
      id: 7,
      title: 'The Alchemist',
      author: 'Paulo Coelho',
      description: 'A magical fable about following your dream.',
      price: 959.20,
      originalPrice: 1359.20,
      stock: 100,
      categoryId: 1,
      category: 'Fiction',
      cover: 'https://images-na.ssl-images-amazon.com/images/S/compressed.photo.goodreads.com/books/1654371463i/18144590.jpg',
      rating: 4.2,
      reviews: 4100,
      pages: 208,
      publisher: 'HarperTorch',
      year: 1993,
      isFeatured: true
    }
  ];
}
