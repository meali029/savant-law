const API_BASE_URL = 'https://api.getmediarank.com/api/v1';

export const templateApi = {
  /**
   * Search templates by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of template objects
   */
  async searchTemplates(query = 'template') {
    try {
      const response = await fetch(`${API_BASE_URL}/template-management/templates/search?query=${encodeURIComponent(query)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  },

  /**
   * Get templates by category using the specific category endpoint
   * @param {string} category - Category name (e.g., "For Startups")
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplatesByCategory(category) {
    try {
      const encodedCategory = encodeURIComponent(category);
      const response = await fetch(`${API_BASE_URL}/template-management/categories/${encodedCategory}/templates`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  },

  /**
   * Get templates by category (legacy method for backward compatibility)
   * @param {string} category - Category name
   * @returns {Promise<Array>} Array of template objects
   */
  async getTemplatesByCategoryLegacy(category) {
    try {
      const response = await fetch(`${API_BASE_URL}/template-management/templates/search?query=${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.filter(template => template.category === category);
    } catch (error) {
      console.error('Error fetching templates by category:', error);
      throw error;
    }
  },

  /**
   * Get featured templates
   * @returns {Promise<Array>} Array of featured template objects
   */
  async getFeaturedTemplates() {
    try {
      const response = await fetch(`${API_BASE_URL}/template-management/templates/search?query=template`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.filter(template => template.is_featured);
    } catch (error) {
      console.error('Error fetching featured templates:', error);
      throw error;
    }
  }
};
