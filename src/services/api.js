// src/services/api.js - Updated for Lambda integration with Experts API
import axios from 'axios';

// API endpoint from environment variable or hardcoded value
// Replace 'your-api-id' and 'region' with your actual API Gateway ID and region
const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || 'https://80wr5reg3m.execute-api.eu-west-1.amazonaws.com/prod';

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
  
  // Rethrow the error with additional info
  throw error;
};

// API service with proper error handling and response parsing
const apiService = {
  // VISA INFORMATION ENDPOINTS

  // Get all countries
  getCountries: async () => {
    try {
      const response = await apiClient.get('/countries');
      
      // The Lambda function returns the countries as a direct array
      if (!response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format from countries API');
      }
      
      return response.data;
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
      
      // The Lambda function returns visa types as a direct array
      if (!response.data) {
        throw new Error('Invalid response format from visa types API');
      }
      
      // Format the response if needed
      const formattedVisa = Array.isArray(response.data) ? response.data : [response.data];
      
      return formattedVisa;
    } catch (error) {
      handleApiError(error, `Error fetching visa types for ${country}`);
    }
  },

  // Get a specific visa type for a country
  getVisaDetails: async (country, visaType) => {
    if (!country || !visaType) {
      throw new Error('Country and visa type parameters are required');
    }
    
    try {
      const response = await apiClient.get(
        `/visas/${encodeURIComponent(country)}/${encodeURIComponent(visaType)}`
      );
      
      if (!response.data) {
        throw new Error('Invalid response format from visa details API');
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error, `Error fetching details for visa ${visaType} in ${country}`);
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
      // Log the visa type before encoding for debugging
      console.log('Updating visa type:', visaType);
      
      // Make sure you're not double-encoding if the URL already contains %20
      const encodedVisaType = visaType.includes('%') ? visaType : encodeURIComponent(visaType);
      const encodedCountry = encodeURIComponent(country);
      
      const url = `/visas/${encodedCountry}/${encodedVisaType}`;
      console.log('Request URL:', url);
      
      const response = await apiClient.put(url, visaData);
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

  // VISA EXPERTS ENDPOINTS

  // Get all experts with optional filtering
  getAllExperts: async (filters = {}) => {
    try {
      // Build query string from filters
      const params = new URLSearchParams();
      
      if (filters.country) params.append('country', filters.country);
      if (filters.visaType) params.append('visaType', filters.visaType);
      if (filters.language) params.append('language', filters.language);
      if (filters.minRating) params.append('minRating', filters.minRating);
      
      const queryString = params.toString();
      const url = `/experts${queryString ? `?${queryString}` : ''}`;
      
      const response = await apiClient.get(url);
      
      if (!response.data || !response.data.experts) {
        throw new Error('Invalid response format from experts API');
      }
      
      return response.data.experts;
    } catch (error) {
      handleApiError(error, 'Error fetching experts');
      return []; // Return empty array on error to prevent UI errors
    }
  },

  // Get an expert by ID
  getExpertById: async (expertId) => {
    if (!expertId) {
      throw new Error('Expert ID is required');
    }
    
    try {
      const response = await apiClient.get(`/experts/${expertId}`);
      
      if (!response.data) {
        throw new Error('Invalid response format from expert details API');
      }
      
      return response.data;
    } catch (error) {
      handleApiError(error, `Error fetching expert with ID ${expertId}`);
    }
  },

  // Create a new expert
  createExpert: async (expertData) => {
    if (!expertData) {
      throw new Error('Expert data is required');
    }
    
    // Convert float values to strings to avoid DynamoDB float type issues
    const preparedData = {
      ...expertData,
      rating: typeof expertData.rating === 'number' ? String(expertData.rating) : expertData.rating,
      reviewCount: typeof expertData.reviewCount === 'number' ? String(expertData.reviewCount) : expertData.reviewCount,
      successRate: typeof expertData.successRate === 'number' ? String(expertData.successRate) : expertData.successRate,
      yearsExperience: typeof expertData.yearsExperience === 'number' ? String(expertData.yearsExperience) : expertData.yearsExperience
    };
    
    try {
      const response = await apiClient.post('/experts', preparedData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Error creating expert');
    }
  },

  // Update an existing expert
  // Update an existing expert
updateExpert: async (expertId, expertData) => {
  if (!expertId || !expertData) {
    throw new Error('Expert ID and expert data are required');
  }
  
  // Convert float values to strings to avoid DynamoDB float type issues
  const preparedData = {
    ...expertData,
    rating: typeof expertData.rating === 'number' ? String(expertData.rating) : expertData.rating,
    reviewCount: typeof expertData.reviewCount === 'number' ? String(expertData.reviewCount) : expertData.reviewCount,
    successRate: typeof expertData.successRate === 'number' ? String(expertData.successRate) : expertData.successRate,
    yearsExperience: typeof expertData.yearsExperience === 'number' ? String(expertData.yearsExperience) : expertData.yearsExperience
  };
  
  try {
    const response = await apiClient.put(`/experts/${expertId}`, preparedData);
    return response.data;
  } catch (error) {
    handleApiError(error, `Error updating expert with ID ${expertId}`);
  }
},
  // Delete an expert
  deleteExpert: async (expertId) => {
    if (!expertId) {
      throw new Error('Expert ID is required');
    }
    
    try {
      const response = await apiClient.delete(`/experts/${expertId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, `Error deleting expert with ID ${expertId}`);
    }
  },

  // Get experts for a specific country
  getExpertsByCountry: async (country) => {
    if (!country) {
      throw new Error('Country parameter is required');
    }
    
    try {
      const response = await apiClient.get(`/experts/countries/${encodeURIComponent(country)}`);
      
      if (!response.data || !response.data.experts) {
        throw new Error('Invalid response format from experts by country API');
      }
      
      return response.data.experts;
    } catch (error) {
      handleApiError(error, `Error fetching experts for country ${country}`);
      return []; // Return empty array on error to prevent UI errors
    }
  },

  // Get experts for a specific visa type
  getExpertsByVisaType: async (visaType) => {
    if (!visaType) {
      throw new Error('Visa type parameter is required');
    }
    
    try {
      const response = await apiClient.get(`/experts/visa-types/${encodeURIComponent(visaType)}`);
      
      if (!response.data || !response.data.experts) {
        throw new Error('Invalid response format from experts by visa type API');
      }
      
      return response.data.experts;
    } catch (error) {
      handleApiError(error, `Error fetching experts for visa type ${visaType}`);
      return []; // Return empty array on error to prevent UI errors
    }
  },

  // Get experts for a specific country and visa type combination
  getExpertsByCountryAndVisa: async (country, visaType) => {
    if (!country || !visaType) {
      throw new Error('Country and visa type parameters are required');
    }
    
    try {
      const encodedCountry = encodeURIComponent(country);
      const encodedVisaType = encodeURIComponent(visaType);
      
      const response = await apiClient.get(
        `/experts/country-visa/${encodedCountry}/${encodedVisaType}`
      );
      
      if (!response.data || !response.data.experts) {
        throw new Error('Invalid response format from experts by country and visa type API');
      }
      
      return response.data.experts;
    } catch (error) {
      handleApiError(error, `Error fetching experts for ${visaType} in ${country}`);
      return []; // Return empty array on error to prevent UI errors
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
  },

  // Mock data for visa experts
  getMockExperts: (country, visaType) => {
    const mockExperts = [
      {
        id: "1",
        name: "Dr. Sarah Johnson",
        photo: "/api/placeholder/150/150",
        title: "Global Immigration Specialist",
        yearsExperience: 15,
        languages: ["English", "French", "Spanish"],
        rating: 4.9,
        reviewCount: 147,
        bio: "Former immigration official with extensive knowledge of North American visa processes.",
        specialization: {
          countries: ["United States", "Canada", "Australia"],
          visaTypes: [
            {
              country: "United States",
              types: ["H-1B", "L-1", "O-1", "EB-5"]
            },
            {
              country: "Canada",
              types: ["Express Entry", "Provincial Nominee", "Start-up Visa"]
            }
          ]
        },
        successRate: 97,
        consultationFee: "$150",
        availability: "Within 48 hours",
        verified: true
      },
      {
        id: "2",
        name: "James Wilson",
        photo: "/api/placeholder/150/150",
        title: "Canadian Immigration Expert",
        yearsExperience: 12,
        languages: ["English", "French"],
        rating: 4.8,
        reviewCount: 124,
        bio: "Former Canadian immigration officer with extensive knowledge of all Canadian immigration pathways.",
        specialization: {
          countries: ["Canada"],
          visaTypes: [
            {
              country: "Canada",
              types: ["Express Entry", "Provincial Nominee", "Family Class", "Study Permits"]
            }
          ]
        },
        successRate: 94,
        consultationFee: "$120",
        availability: "Same day",
        verified: true
      },
      {
        id: "3",
        name: "Elena Rodriguez",
        photo: "/api/placeholder/150/150",
        title: "US Immigration Attorney",
        yearsExperience: 10,
        languages: ["English", "Spanish"],
        rating: 4.7,
        reviewCount: 98,
        bio: "Specialized in employment-based and family-based immigration to the United States.",
        specialization: {
          countries: ["United States"],
          visaTypes: [
            {
              country: "United States",
              types: ["Family-Based Green Cards", "H-1B", "L-1", "E-2", "K-1 Fiancé"]
            }
          ]
        },
        successRate: 95,
        consultationFee: "$135",
        availability: "Within 24 hours",
        verified: true
      }
    ];
    
    // Filter by country and visa type if provided
    let filteredExperts = mockExperts;
    
    if (country) {
      filteredExperts = filteredExperts.filter(expert => 
        expert.specialization.countries.includes(country)
      );
    }
    
    if (visaType) {
      filteredExperts = filteredExperts.filter(expert => {
        // Check if expert handles this visa type for the specific country
        const countryVisaTypes = expert.specialization.visaTypes.find(vt => 
          vt.country === country
        );
        
        return countryVisaTypes && countryVisaTypes.types.includes(visaType);
      });
    }
    
    return filteredExperts;
  }
};

export default apiService;