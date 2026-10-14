import React from 'react';
import {
  BookOpen,
  Library,
  FlaskConical,
  BriefcaseBusiness,
  Sprout,
  Baby,
  Landmark,
  Palette,
  BookImage,
  GraduationCap,
  Heart,
  Search,
  ShieldAlert,
  Ghost,
  WandSparkles,
  Rocket,
  UserRound,
  Brain,
  Scale,
  ChartNoAxesCombined,
  Lightbulb,
  Compass,
} from 'lucide-react';

const LUCIDE_COMPONENTS = {
  BookOpen,
  Library,
  FlaskConical,
  BriefcaseBusiness,
  Sprout,
  Baby,
  Landmark,
  Palette,
  BookImage,
  GraduationCap,
  Heart,
  Search,
  ShieldAlert,
  Ghost,
  WandSparkles,
  Rocket,
  UserRound,
  Brain,
  Scale,
  ChartNoAxesCombined,
  Lightbulb,
  Compass,
};

// Normalized category mapping
const CATEGORY_MAP = {
  // Fiction & Literature
  'fiction': BookOpen,
  'novels': BookOpen,
  'short stories': BookOpen,
  'young adult fiction': BookOpen,
  'historical fiction': Landmark,
  'literature': Library,
  'cultural literature': Library,

  // Non-Fiction & Knowledge
  'non-fiction': Library,
  'non fiction': Library,
  'biography': UserRound,
  'autobiography': UserRound,
  'history': Landmark,
  'philosophy': Brain,
  'hindu philosophy': Brain,
  'psychology': Brain,
  'politics': Scale,
  'religion & spirituality': Landmark,
  'mythology': Landmark,
  'spirituality': WandSparkles,
  'buddhist literature': Brain,
  'islamic literature': Landmark,
  'christian literature': Landmark,

  // Science & Tech
  'science & technology': FlaskConical,
  'science and technology': FlaskConical,
  'science': FlaskConical,
  'mathematics': FlaskConical,
  'computer science': FlaskConical,
  'programming': Lightbulb,
  'artificial intelligence': Brain,
  'machine learning': Brain,
  'engineering': BriefcaseBusiness,

  // Business & Finance
  'business & economics': BriefcaseBusiness,
  'business and economics': BriefcaseBusiness,
  'business': BriefcaseBusiness,
  'economics': BriefcaseBusiness,
  'finance': ChartNoAxesCombined,
  'entrepreneurship': Lightbulb,
  'personal development': Sprout,
  'self-help': Sprout,
  'self help': Sprout,

  // Genres
  'romance': Heart,
  'mystery': Search,
  'crime fiction': Search,
  'thriller': ShieldAlert,
  'horror': Ghost,
  'fantasy': WandSparkles,
  'science fiction': Rocket,
  'sci-fi': Rocket,
  'adventure': Compass,
  'travel': Compass,

  // Comics & Manga
  'comics & manga': BookImage,
  'comics and manga': BookImage,
  'comics': BookImage,
  'manga': BookImage,
  'manhwa': BookImage,
  'manhua': BookImage,
  'graphic novels': BookImage,
  'indian comics': BookImage,
  'superhero comics': ShieldAlert,
  'webtoon collections': BookImage,
  'comic anthologies': BookImage,

  // Academic & Children
  'academic & textbooks': GraduationCap,
  'academic and textbooks': GraduationCap,
  'academic': GraduationCap,
  'textbooks': GraduationCap,
  'school textbooks': GraduationCap,
  'college textbooks': GraduationCap,
  'competitive exams': GraduationCap,
  'government exam preparation': Landmark,
  'language learning': BookOpen,
  'children & young adult': Baby,
  'children and young adult': Baby,
  'children': Baby,
  "children's comics": Baby,
  'bedtime stories': Baby,
  'picture books': Palette,
  'activity books': Palette,
  'fairy tales': WandSparkles,
  'educational stories': GraduationCap,
  'arts & photography': Palette,
  'arts and photography': Palette,
  'arts': Palette,
};

/**
 * CategoryIcon Component
 * Renders consistent Lucide icon or clean emoji, eliminating broken '?' / '??' characters.
 */
export const CategoryIcon = ({ name = '', icon = '', size = 18, className = '', style = {} }) => {
  // 1. Direct Lucide icon name match (e.g. 'BookOpen', 'Library')
  if (icon && typeof icon === 'string' && LUCIDE_COMPONENTS[icon.trim()]) {
    const IconComponent = LUCIDE_COMPONENTS[icon.trim()];
    return <IconComponent size={size} className={className} style={{ verticalAlign: 'middle', ...style }} />;
  }

  // 2. Lookup by category name or slug
  const normalizedName = (name || '').toLowerCase().trim();
  if (CATEGORY_MAP[normalizedName]) {
    const IconComponent = CATEGORY_MAP[normalizedName];
    return <IconComponent size={size} className={className} style={{ verticalAlign: 'middle', ...style }} />;
  }

  // Check if any key is contained in the name
  for (const [key, IconComp] of Object.entries(CATEGORY_MAP)) {
    if (normalizedName.includes(key)) {
      return <IconComp size={size} className={className} style={{ verticalAlign: 'middle', ...style }} />;
    }
  }

  // 3. If icon is a valid Unicode emoji (and does NOT contain literal '?')
  if (icon && typeof icon === 'string' && !icon.includes('?') && icon.trim().length > 0) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: `${size}px`,
          lineHeight: 1,
          ...style,
        }}
      >
        {icon}
      </span>
    );
  }

  // 4. Default fallback: BookOpen
  return <BookOpen size={size} className={className} style={{ verticalAlign: 'middle', ...style }} />;
};

export default CategoryIcon;
