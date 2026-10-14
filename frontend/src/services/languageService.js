import api from './api';

export const languageService = {
  async getAll() {
    try {
      const response = await api.get('/languages');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data;
      }
      return this.getDefaultLanguages();
    } catch (error) {
      console.warn('Failed to fetch languages, using default list:', error);
      return this.getDefaultLanguages();
    }
  },

  async create(languageData) {
    const response = await api.post('/languages', languageData);
    return response.data;
  },

  getDefaultLanguages() {
    return [
      { code: 'en', name: 'English', nativeName: 'English', script: 'Latin' },
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Devanagari' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Tamil' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telugu' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', script: 'Bengali' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Devanagari' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujarati' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', script: 'Kannada' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', script: 'Malayalam' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', script: 'Gurmukhi' },
      { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', script: 'Odia' },
      { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', script: 'Bengali' },
      { code: 'ur', name: 'Urdu', nativeName: 'اردو', script: 'Arabic-Persian' },
      { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', script: 'Devanagari' },
      { code: 'es', name: 'Spanish', nativeName: 'Español', script: 'Latin' },
      { code: 'fr', name: 'French', nativeName: 'Français', script: 'Latin' },
      { code: 'de', name: 'German', nativeName: 'Deutsch', script: 'Latin' },
      { code: 'ja', name: 'Japanese', nativeName: '日本語', script: 'Japanese' },
      { code: 'zh', name: 'Chinese', nativeName: '中文', script: 'Simplified Chinese' },
      { code: 'ko', name: 'Korean', nativeName: '한국어', script: 'Hangul' },
      { code: 'ru', name: 'Russian', nativeName: 'Русский', script: 'Cyrillic' }
    ];
  }
};

export default languageService;
