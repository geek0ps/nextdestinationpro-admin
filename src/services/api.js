// src/services/api.js - Complete implementation for Lambda integration
import axios from 'axios';

// API endpoint from environment variable or hardcoded value
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://your-api-gateway-endpoint.amazonaws.com/dev';

// Create axios instance with common configuration
const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for authentication if needed
apiClient.interceptors.request.use(
  config => {
    // Get token from localStorage if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Add response interceptor for error handling
apiClient.interceptors.response.use(
  response => response,
  error => {
    // Common error handling
    const { response } = error;
    if (response) {
      if (response.status === 401) {
        // Handle unauthorized (session expired or not logged in)
        console.error('Authentication error. Please log in again.');
        // Could redirect to login page if needed
        // window.location.href = '/login';
      } else if (response.status === 403) {
        // Handle forbidden
        console.error('You do not have permission to perform this action.');
      } else if (response.status >= 500) {
        // Handle server errors
        console.error('Server error occurred. Please try again later.');
      }
    } else {
      // Network errors or request cancelled
      console.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Utility function for handling API errors
const handleApiError = (error, customMessage) => {
  // Get a user-friendly error message
  let errorMessage;
  
  if (error.response && error.response.data) {
    // Extract error message from API response
    errorMessage = error.response.data.message || error.response.data.error || 'An error occurred';
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = 'No response received from server';
  } else {
    // Error in setting up the request
    errorMessage = error.message || 'Unknown error';
  }
  
  // Log error for debugging
  console.error(`${customMessage}: ${errorMessage}`, error);
  
  // You could implement additional error logging here
  // logToService(error, customMessage);
  
  // Rethrow the error with additional info
  throw error;
};

// API service with proper error handling and response parsing
const apiService = {
  // Get all countries
  getCountries: async () => {
    try {
      const response = await apiClient.get('/countries');
      
      // Validate response structure
      if (!response.data || !Array.isArray(response.data.countries)) {
        throw new Error('Invalid response format from countries API');
      }
      
      return response.data.countries;
    } catch (error) {
      handleApiError(error, 'Error fetching countries');
    }
  },

  // Get visa types for a specific country
  getVisaTypes: async (country) => {
    if (!country) {
      throw new Error('Country parameter is required');
    }
    
    try {
      const response = await apiClient.get(`/visas/${encodeURIComponent(country)}`);
      
      // Validate response structure
      if (!response.data || !Array.isArray(response.data.visa_types)) {
        throw new Error('Invalid response format from visa types API');
      }
      
      return response.data.visa_types;
    } catch (error) {
      handleApiError(error, `Error fetching visa types for ${country}`);
    }
  },

  // Create a new visa type
  createVisa: async (country, visaData) => {
    if (!country || !visaData) {
      throw new Error('Country and visa data are required');
    }
    
    // Validate required fields
    if (!visaData.visa_type || !visaData.description) {
      throw new Error('Visa type and description are required fields');
    }
    
    try {
      const response = await apiClient.post(`/visas/${encodeURIComponent(country)}`, visaData);
      return response.data;
    } catch (error) {
      handleApiError(error, `Error creating visa for ${country}`);
    }
  },

  // Update an existing visa type
  updateVisa: async (country, visaType, visaData) => {
    if (!country || !visaType || !visaData) {
      throw new Error('Country, visa type, and visa data are required');
    }
    
    try {
      const response = await apiClient.put(
        `/visas/${encodeURIComponent(country)}/${encodeURIComponent(visaType)}`,
        visaData
      );
      return response.data;
    } catch (error) {
      handleApiError(error, `Error updating visa ${visaType} for ${country}`);
    }
  },

  // Delete a visa type
  deleteVisa: async (country, visaType) => {
    if (!country || !visaType) {
      throw new Error('Country and visa type are required');
    }
    
    try {
      const response = await apiClient.delete(
        `/visas/${encodeURIComponent(country)}/${encodeURIComponent(visaType)}`
      );
      return response.data;
    } catch (error) {
      handleApiError(error, `Error deleting visa ${visaType} for ${country}`);
    }
  },

  // For development/testing without backend
  getMockCountries: () => {
    return ['United States', 'Canada', 'United Kingdom', 'Australia', 
            'Germany', 'Singapore', 'United Arab Emirates', 'Switzerland', 
            'Netherlands', 'Japan', 'South Korea', 'Hong Kong', 'France',
            'Spain', 'Italy', 'Portugal', 'Brazil', 'Mexico', 'Sweden', 'Norway'];
  },

  getMockVisaTypes: (country) => {
    if (country === 'United States') {
      return [
        {
          visa_type: 'B-1/B-2',
          description: 'Visitor visa for business (B-1) or tourism/pleasure (B-2)',
          eligible_applicants: ['Business travelers', 'Tourists', 'Visiting family/friends'],
          duration: 'Up to 6 months, may be extended',
          exempted_countries: ['Canada', 'United Kingdom', 'Australia', 'Japan'],
          restricted_countries: ['Iran', 'North Korea', 'Syria']
        },
        {
          visa_type: 'F-1',
          description: 'Student visa for academic studies',
          eligible_applicants: ['Full-time students admitted to US educational institutions'],
          duration: 'Duration of study program plus 60 days',
          exempted_countries: [],
          restricted_countries: ['Iran', 'North Korea', 'Syria']
        },
        {
          visa_type: 'H-1B',
          description: 'Temporary work visa for specialty occupations',
          eligible_applicants: ['Professionals with bachelor\'s degree or higher in specialized fields'],
          duration: 'Up to 6 years (3 years initially, with possible 3-year extension)',
          exempted_countries: [],
          restricted_countries: []
        }
      ];
    } else if (country === 'Canada') {
      return [
        {
          visa_type: 'Visitor Visa',
          description: 'Temporary visa for tourism, visiting family/friends, or business visits',
          eligible_applicants: ['Tourists', 'Business visitors', 'Family visitors'],
          duration: 'Up to 6 months',
          exempted_countries: ['United States', 'United Kingdom', 'Australia'],
          restricted_countries: []
        },
        {
          visa_type: 'Study Permit',
          description: 'Permit for international students to study at designated learning institutions',
          eligible_applicants: ['Students accepted by Canadian educational institutions'],
          duration: 'Length of study program plus 90 days',
          exempted_countries: [],
          restricted_countries: []
        },
        {
          visa_type: 'Work Permit',
          description: 'Permit allowing foreign nationals to work temporarily in Canada',
          eligible_applicants: ['Skilled workers', 'Temporary foreign workers', 'International graduates'],
          duration: 'Varies based on employment offer, typically 1-3 years',
          exempted_countries: [],
          restricted_countries: []
        }
      ];
    } else {
      // Generate random visa types for other countries
      return [
        {
          visa_type: 'Tourist Visa',
          description: `Tourist visa for ${country}`,
          eligible_applicants: ['Tourists', 'Visitors'],
          duration: 'Up to 90 days',
          exempted_countries: [],
          restricted_countries: []
        },
        {
          visa_type: 'Business Visa',
          description: `Business visa for ${country}`,
          eligible_applicants: ['Business travelers'],
          duration: 'Up to 60 days',
          exempted_countries: [],
          restricted_countries: []
        }
      ];
    }
  }
};

export default apiService;