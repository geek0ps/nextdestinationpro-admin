import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, Modal, Alert,
  Navbar, Nav, Dropdown, ListGroup, Badge, Spinner, InputGroup, FormControl, Tabs, Tab
} from 'react-bootstrap';
import apiService from './services/api';

function SpecialistsManagement() {
  // State for specialists
  const [specialists, setSpecialists] = useState([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [visaTypeFilter, setVisaTypeFilter] = useState('');
  
  // State for countries and visa types (for filters and dropdowns)
  const [countries, setCountries] = useState([]);
  const [visaTypes, setVisaTypes] = useState([]);
  
  // State for modal and form
  const [showSpecialistModal, setShowSpecialistModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add', 'edit', or 'view'
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    photo: '',
    bio: '',
    yearsExperience: '',
    languages: '',
    rating: '',
    reviewCount: '',
    specialization: {
      countries: [],
      visaTypes: []
    },
    successRate: '',
    consultationFee: '',
    availability: '',
    verified: true
  });
  
  // State for visaTypes inputs in the form
  const [selectedFormCountry, setSelectedFormCountry] = useState('');
  const [countryVisaTypes, setCountryVisaTypes] = useState([]);
  const [selectedCountryVisaTypes, setSelectedCountryVisaTypes] = useState([]);
  
  // State for UI feedback
  const [alert, setAlert] = useState({ show: false, variant: 'success', message: '' });
  const [loading, setLoading] = useState({
    specialists: false,
    countries: false,
    visaTypes: false,
    operations: false
  });
  const [error, setError] = useState({
    specialists: null,
    countries: null,
    visaTypes: null,
    operations: null
  });

  // Fetch specialists, countries, and visa types on component mount
  useEffect(() => {
    fetchSpecialists();
    fetchCountries();
  }, []);

  // Fetch visa types when a country is selected in the form
  useEffect(() => {
    if (selectedFormCountry) {
      fetchVisaTypesForCountry(selectedFormCountry);
    } else {
      setCountryVisaTypes([]);
    }
  }, [selectedFormCountry]);

  // API Functions
  const fetchSpecialists = async () => {
    setLoading(prev => ({ ...prev, specialists: true }));
    setError(prev => ({ ...prev, specialists: null }));
    
    try {
      let specialistsData;
      
      // Apply filters if they exist
      if (countryFilter && visaTypeFilter) {
        specialistsData = await apiService.getExpertsByCountryAndVisa(countryFilter, visaTypeFilter);
      } else if (countryFilter) {
        specialistsData = await apiService.getExpertsByCountry(countryFilter);
      } else if (visaTypeFilter) {
        specialistsData = await apiService.getExpertsByVisaType(visaTypeFilter);
      } else {
        specialistsData = await apiService.getAllExperts();
      }
      
      // If API returns no data, use mock data for development
      if (!specialistsData || specialistsData.length === 0) {
        console.log('No specialists found in API, using fallback mock data');
        specialistsData = apiService.getMockExperts();
      }
      
      setSpecialists(specialistsData);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        specialists: error.response?.data?.message || error.message || 'Failed to fetch specialists' 
      }));
      showAlert('danger', `Error fetching specialists: ${error.message}`);
      
      // Fall back to mock data on error
      try {
        const mockData = apiService.getMockExperts();
        setSpecialists(mockData);
      } catch (mockErr) {
        console.error('Error generating mock data:', mockErr);
      }
    } finally {
      setLoading(prev => ({ ...prev, specialists: false }));
    }
  };

  const fetchCountries = async () => {
    setLoading(prev => ({ ...prev, countries: true }));
    setError(prev => ({ ...prev, countries: null }));
    
    try {
      const countriesData = await apiService.getCountries();
      setCountries(countriesData);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        countries: error.response?.data?.message || error.message || 'Failed to fetch countries' 
      }));
      showAlert('danger', `Error fetching countries: ${error.message}`);
      
      // Fall back to mock countries
      const mockCountries = apiService.getMockCountries();
      setCountries(mockCountries);
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchVisaTypesForCountry = async (country) => {
    setLoading(prev => ({ ...prev, visaTypes: true }));
    setError(prev => ({ ...prev, visaTypes: null }));
    
    try {
      const visaData = await apiService.getVisaTypes(country);
      setCountryVisaTypes(visaData);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        visaTypes: error.response?.data?.message || error.message || `Failed to fetch visa types for ${country}` 
      }));
      showAlert('danger', `Error fetching visa types: ${error.message}`);
      
      // Fall back to mock visa types
      const mockVisaTypes = apiService.getMockVisaTypes(country);
      setCountryVisaTypes(mockVisaTypes);
    } finally {
      setLoading(prev => ({ ...prev, visaTypes: false }));
    }
  };

  // Prepare data for visa type selection in modal
  const prepareSpecializationData = (specialist) => {
    // Reset selected country visa types
    setSelectedCountryVisaTypes([]);
    
    if (specialist && specialist.specialization) {
      // Find all countries and their visa types from the specialist
      const countryVisaMap = [];
      
      if (specialist.specialization.visaTypes && specialist.specialization.visaTypes.length > 0) {
        specialist.specialization.visaTypes.forEach(countryVisa => {
          const country = countryVisa.country;
          const visaTypes = countryVisa.types || [];
          
          // Store this mapping
          countryVisaMap.push({
            country,
            visaTypes
          });
          
          // If this is the currently selected country in the form, update selected visa types
          if (country === selectedFormCountry) {
            setSelectedCountryVisaTypes(visaTypes);
          }
        });
      }
      
      return countryVisaMap;
    }
    
    return [];
  };

  // Event Handlers
  const handleSpecialistSelect = (specialist) => {
    setSelectedSpecialist(specialist);
    
    if (specialist) {
      // Format languages as comma-separated string
      const languagesStr = Array.isArray(specialist.languages) 
        ? specialist.languages.join(', ')
        : specialist.languages || '';
      
      // Format countries as array
      const countries = specialist.specialization?.countries || [];
      
      // Set form data for editing
      setFormData({
        id: specialist.id || '',
        name: specialist.name || '',
        title: specialist.title || '',
        photo: specialist.photo || specialist.image || '',
        bio: specialist.bio || specialist.description || '',
        yearsExperience: specialist.yearsExperience || specialist.experience || '',
        languages: languagesStr,
        rating: specialist.rating || 4.5,
        reviewCount: specialist.reviewCount || specialist.reviews || 0,
        specialization: {
          countries: countries,
          visaTypes: specialist.specialization?.visaTypes || []
        },
        successRate: specialist.successRate || 95,
        consultationFee: specialist.consultationFee || '$150',
        availability: specialist.availability || 'Available next week',
        verified: specialist.verified !== undefined ? specialist.verified : true
      });
      
      // If there's at least one country, select the first one in the form
      if (countries.length > 0) {
        setSelectedFormCountry(countries[0]);
      }
    }
  };

  const handleAddSpecialist = () => {
    setModalMode('add');
    // Reset form data
    setFormData({
      name: '',
      title: '',
      photo: '',
      bio: '',
      yearsExperience: '',
      languages: '',
      rating: 4.7,
      reviewCount: 0,
      specialization: {
        countries: [],
        visaTypes: []
      },
      successRate: 95,
      consultationFee: '$150',
      availability: 'Available next week',
      verified: true
    });
    setSelectedFormCountry('');
    setSelectedCountryVisaTypes([]);
    setShowSpecialistModal(true);
  };

  const handleEditSpecialist = () => {
    if (!selectedSpecialist) {
      showAlert('warning', 'Please select a specialist to edit');
      return;
    }
    setModalMode('edit');
    
    // Prepare the visa type data for the form
    prepareSpecializationData(selectedSpecialist);
    
    setShowSpecialistModal(true);
  };

  const handleViewSpecialist = () => {
    if (!selectedSpecialist) {
      showAlert('warning', 'Please select a specialist to view');
      return;
    }
    setModalMode('view');
    setShowSpecialistModal(true);
  };

  const handleDeleteSpecialist = async () => {
    if (!selectedSpecialist) {
      showAlert('warning', 'Please select a specialist to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedSpecialist.name}?`)) {
      setLoading(prev => ({ ...prev, operations: true }));
      setError(prev => ({ ...prev, operations: null }));
      
      try {
        await apiService.deleteExpert(selectedSpecialist.id);
        showAlert('success', `Successfully deleted ${selectedSpecialist.name}`);
        
        // Refresh specialists after deletion
        fetchSpecialists();
        setSelectedSpecialist(null);
      } catch (error) {
        setError(prev => ({ 
          ...prev, 
          operations: error.response?.data?.message || error.message || 'Failed to delete specialist' 
        }));
        showAlert('danger', `Error deleting specialist: ${error.message}`);
      } finally {
        setLoading(prev => ({ ...prev, operations: false }));
      }
    }
  };

  const handleSubmitSpecialist = async () => {
    // Validate required fields
    if (!formData.name || !formData.title) {
      showAlert('danger', 'Name and title are required fields');
      return;
    }
    
    setLoading(prev => ({ ...prev, operations: true }));
    setError(prev => ({ ...prev, operations: null }));
    
    try {
      // Format data for API
      const formattedData = {
        ...formData,
        // Convert languages from comma-separated string to array
        languages: typeof formData.languages === 'string' 
          ? formData.languages.split(',').map(item => item.trim()).filter(item => item !== '')
          : formData.languages,
        // Format specialization data
        specialization: {
          countries: formData.specialization.countries,
          visaTypes: formData.specialization.visaTypes
        }
      };
      
      // Ensure numeric fields are proper numbers
      formattedData.yearsExperience = Number(formattedData.yearsExperience);
      formattedData.rating = Number(formattedData.rating);
      formattedData.reviewCount = Number(formattedData.reviewCount);
      formattedData.successRate = Number(formattedData.successRate);
  
      if (modalMode === 'add') {
        await apiService.createExpert(formattedData);
        showAlert('success', `Successfully added ${formData.name}`);
      } else if (modalMode === 'edit') {
        await apiService.updateExpert(formData.id, formattedData);
        showAlert('success', `Successfully updated ${formData.name}`);
      }
  
      // Refresh specialists after adding or updating
      fetchSpecialists();
      setShowSpecialistModal(false);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        operations: error.response?.data?.message || error.message || 'Failed to save specialist data' 
      }));
      showAlert('danger', `Error ${modalMode === 'add' ? 'adding' : 'updating'} specialist: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, operations: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
      return;
    }
    
    // Handle nested specialization fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
      return;
    }
    
    // Handle regular inputs
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCountryChange = (e) => {
    const { value, checked } = e.target;
    
    // Update the list of selected countries
    let updatedCountries = [...formData.specialization.countries];
    
    if (checked) {
      // Add country if it's not already in the list
      if (!updatedCountries.includes(value)) {
        updatedCountries.push(value);
      }
    } else {
      // Remove country if it exists in the list
      updatedCountries = updatedCountries.filter(country => country !== value);
    }
    
    // Update form data with new countries list
    setFormData({
      ...formData,
      specialization: {
        ...formData.specialization,
        countries: updatedCountries
      }
    });
  };

  const handleFormCountrySelect = (country) => {
    setSelectedFormCountry(country);
    
    // Check if we already have visa types for this country in the specialist data
    if (selectedSpecialist && selectedSpecialist.specialization && selectedSpecialist.specialization.visaTypes) {
      const existingCountryVisa = selectedSpecialist.specialization.visaTypes.find(cv => cv.country === country);
      if (existingCountryVisa && existingCountryVisa.types) {
        setSelectedCountryVisaTypes(existingCountryVisa.types);
      } else {
        setSelectedCountryVisaTypes([]);
      }
    } else {
      setSelectedCountryVisaTypes([]);
    }
  };

  const handleVisaTypeChange = (e) => {
    const { value, checked } = e.target;
    
    // Update the list of selected visa types for the current country
    let updatedSelectedVisaTypes = [...selectedCountryVisaTypes];
    
    if (checked) {
      // Add visa type if it's not already in the list
      if (!updatedSelectedVisaTypes.includes(value)) {
        updatedSelectedVisaTypes.push(value);
      }
    } else {
      // Remove visa type if it exists in the list
      updatedSelectedVisaTypes = updatedSelectedVisaTypes.filter(type => type !== value);
    }
    
    setSelectedCountryVisaTypes(updatedSelectedVisaTypes);
    
    // Update the specialization visaTypes in form data
    const updatedVisaTypes = [...formData.specialization.visaTypes];
    
    // Find if we already have an entry for this country
    const existingIndex = updatedVisaTypes.findIndex(item => item.country === selectedFormCountry);
    
    if (existingIndex !== -1) {
      // Update existing entry
      updatedVisaTypes[existingIndex] = {
        country: selectedFormCountry,
        types: updatedSelectedVisaTypes
      };
    } else if (updatedSelectedVisaTypes.length > 0) {
      // Add new entry
      updatedVisaTypes.push({
        country: selectedFormCountry,
        types: updatedSelectedVisaTypes
      });
    }
    
    // Update form data
    setFormData({
      ...formData,
      specialization: {
        ...formData.specialization,
        visaTypes: updatedVisaTypes
      }
    });
  };

  const handleAddCountryVisaTypes = () => {
    // Add current country and selected visa types to the specialist's data
    if (selectedFormCountry && selectedCountryVisaTypes.length > 0) {
      const updatedVisaTypes = [...formData.specialization.visaTypes];
      
      // Find if we already have an entry for this country
      const existingIndex = updatedVisaTypes.findIndex(item => item.country === selectedFormCountry);
      
      if (existingIndex !== -1) {
        // Update existing entry
        updatedVisaTypes[existingIndex] = {
          country: selectedFormCountry,
          types: selectedCountryVisaTypes
        };
      } else {
        // Add new entry
        updatedVisaTypes.push({
          country: selectedFormCountry,
          types: selectedCountryVisaTypes
        });
      }
      
      // Update form data
      setFormData({
        ...formData,
        specialization: {
          ...formData.specialization,
          visaTypes: updatedVisaTypes
        }
      });
      
      // Reset selection
      setSelectedFormCountry('');
      setSelectedCountryVisaTypes([]);
    }
  };

  const removeCountryVisaTypes = (country) => {
    // Remove country and its visa types from the specialist's data
    const updatedVisaTypes = formData.specialization.visaTypes.filter(item => item.country !== country);
    
    // Update form data
    setFormData({
      ...formData,
      specialization: {
        ...formData.specialization,
        visaTypes: updatedVisaTypes
      }
    });
  };

  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => {
      setAlert({ show: false, variant, message });
    }, 5000);
  };

  // Filter specialists based on search term
  const filteredSpecialists = searchTerm.trim() === '' 
    ? specialists 
    : specialists.filter(specialist => 
        specialist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        specialist.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return (
        <Card className="ndp-card mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              Visa Specialists Management
            </h5>
            <div>
              <Button 
                variant="primary" 
                onClick={handleAddSpecialist}
                disabled={loading.operations}
                className="me-2"
              >
                <i className="bi bi-plus-lg me-1"></i> Add New Specialist
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={handleViewSpecialist}
                disabled={!selectedSpecialist || loading.operations}
                className="me-2"
              >
                <i className="bi bi-eye me-1"></i> View
              </Button>
              <Button 
                variant="outline-primary" 
                onClick={handleEditSpecialist}
                disabled={!selectedSpecialist || loading.operations}
                className="me-2"
              >
                <i className="bi bi-pencil me-1"></i> Edit
              </Button>
              <Button 
                variant="outline-danger" 
                onClick={handleDeleteSpecialist}
                disabled={!selectedSpecialist || loading.operations}
              >
                {loading.operations ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-1"
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-1"></i> Delete
                  </>
                )}
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Alert for feedback */}
            {alert.show && (
              <Alert variant={alert.variant} onClose={() => setAlert({...alert, show: false})} dismissible>
                <i className={`bi bi-${alert.variant === 'success' ? 'check-circle' : 
                              alert.variant === 'danger' ? 'exclamation-circle' : 
                              alert.variant === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                {alert.message}
              </Alert>
            )}
            
            {/* Search and Filters */}
            <Row className="mb-4">
              <Col md={6} lg={4}>
                <InputGroup>
                  <InputGroup.Text><i className="bi bi-search"></i></InputGroup.Text>
                  <FormControl
                    placeholder="Search specialists..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={6} lg={8} className="mt-3 mt-md-0">
                <Row>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Filter by Country</Form.Label>
                      <Form.Select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                      >
                        <option value="">All Countries</option>
                        {countries.map((country, idx) => (
                          <option key={idx} value={country}>{country}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={5}>
                    <Form.Group>
                      <Form.Label>Filter by Visa Type</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="Enter visa type..."
                        value={visaTypeFilter}
                        onChange={(e) => setVisaTypeFilter(e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={2} className="d-flex align-items-end">
                    <Button 
                      variant="outline-secondary" 
                      className="w-100"
                      onClick={() => {
                        setCountryFilter('');
                        setVisaTypeFilter('');
                        fetchSpecialists();
                      }}
                    >
                      Reset
                    </Button>
                  </Col>
                </Row>
              </Col>
            </Row>
            
            {/* Specialists Table */}
            {loading.specialists ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Loading specialists...</p>
              </div>
            ) : error.specialists ? (
              <div className="text-center py-5">
                <i className="bi bi-exclamation-triangle text-danger display-1"></i>
                <p className="mt-3 mb-0">Error loading specialists</p>
                <p className="text-muted">{error.specialists}</p>
                <Button 
                  variant="primary" 
                  size="sm" 
                  className="mt-2"
                  onClick={fetchSpecialists}
                >
                  <i className="bi bi-arrow-clockwise me-1"></i> Retry
                </Button>
              </div>
            ) : (
              <div className="table-responsive">
                <Table hover className="specialist-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Name</th>
                      <th>Title</th>
                      <th>Countries</th>
                      <th>Experience</th>
                      <th>Rating</th>
                      <th>Languages</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSpecialists.length > 0 ? (
                      filteredSpecialists.map((specialist, index) => (
                        <tr
                          key={specialist.id || index}
                          onClick={() => handleSpecialistSelect(specialist)}
                          className={selectedSpecialist && selectedSpecialist.id === specialist.id ? 'selected-row' : ''}
                        >
                          <td className="text-center">
                            <div className="specialist-avatar">
                              <img 
                                src={specialist.photo || specialist.image || "/api/placeholder/40/40"} 
                                alt={specialist.name} 
                                className="rounded-circle"
                                width="40"
                                height="40"
                                onError={(e) => {
                                  e.target.src = "https://via.placeholder.com/40";
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <span className="fw-bold">{specialist.name}</span>
                              {(specialist.verified !== undefined ? specialist.verified : true) && (
                                <Badge bg="success" className="ms-2">
                                  <i className="bi bi-check-circle-fill me-1"></i> Verified
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>{specialist.title}</td>
                          <td>
                            {specialist.specialization?.countries ? (
                              <div className="d-flex flex-wrap gap-1">
                                {specialist.specialization.countries.slice(0, 2).map((country, idx) => (
                                  <Badge key={idx} bg="light" text="dark">{country}</Badge>
                                ))}
                                {specialist.specialization.countries.length > 2 && (
                                  <Badge bg="light" text="dark">+{specialist.specialization.countries.length - 2}</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </td>
                          <td>{specialist.yearsExperience || specialist.experience || '—'} years</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="bi bi-star-fill text-warning me-1"></i>
                              <span>{specialist.rating || '4.5'}</span>
                              <span className="text-muted ms-1">({specialist.reviewCount || specialist.reviews || 0})</span>
                            </div>
                          </td>
                          <td>
                            {specialist.languages ? (
                              <div className="d-flex flex-wrap gap-1">
                                {Array.isArray(specialist.languages) ? (
                                  specialist.languages.slice(0, 2).map((lang, idx) => (
                                    <Badge key={idx} bg="info" className="bg-opacity-25">{lang}</Badge>
                                  ))
                                ) : (
                                  <Badge bg="info" className="bg-opacity-25">{specialist.languages}</Badge>
                                )}
                                {Array.isArray(specialist.languages) && specialist.languages.length > 2 && (
                                  <Badge bg="info" className="bg-opacity-25">+{specialist.languages.length - 2}</Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted">Not specified</span>
                            )}
                          </td>
                          <td>{specialist.availability || 'Available'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center py-4">
                          <i className="bi bi-person-x text-muted display-4"></i>
                          <p className="mt-3 mb-2">No specialists found</p>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={handleAddSpecialist}
                          >
                            <i className="bi bi-plus-lg me-1"></i> Add New Specialist
                          </Button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
      
          {/* Add/Edit Specialist Modal */}
          <Modal
            show={showSpecialistModal}
            onHide={() => setShowSpecialistModal(false)}
            size="lg"
            centered
            className="ndp-modal"
            backdrop="static"
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {modalMode === 'add' ? (
                  <><i className="bi bi-plus-circle me-2"></i>Add New Specialist</>
                ) : modalMode === 'edit' ? (
                  <><i className="bi bi-pencil me-2"></i>Edit Specialist</>
                ) : (
                  <><i className="bi bi-eye me-2"></i>Specialist Details</>
                )}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Tabs 
                defaultActiveKey="basic" 
                id="specialist-form-tabs"
                className="mb-3"
              >
                <Tab eventKey="basic" title="Basic Information">
                  <Form>
                    {modalMode === 'view' && formData.photo && (
                      <div className="text-center mb-4">
                        <img 
                          src={formData.photo}
                          alt={formData.name}
                          className="rounded-circle border"
                          style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150";
                          }}
                        />
                      </div>
                    )}
                    
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="name">
                          <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Full name"
                            disabled={modalMode === 'view'}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="title">
                          <Form.Label>Professional Title <span className="text-danger">*</span></Form.Label>
                          <Form.Control
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Immigration Attorney, Visa Consultant"
                            disabled={modalMode === 'view'}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col md={4}>
                        <Form.Group controlId="photo">
                          <Form.Label>Photo URL</Form.Label>
                          <Form.Control
                            type="text"
                            name="photo"
                            value={formData.photo}
                            onChange={handleInputChange}
                            placeholder="URL to profile photo"
                            disabled={modalMode === 'view'}
                          />
                          <Form.Text className="text-muted">
                            Public URL to profile photo (optional)
                          </Form.Text>
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="yearsExperience">
                          <Form.Label>Years of Experience</Form.Label>
                          <Form.Control
                            type="number"
                            name="yearsExperience"
                            value={formData.yearsExperience}
                            onChange={handleInputChange}
                            placeholder="e.g. 5"
                            disabled={modalMode === 'view'}
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={4}>
                        <Form.Group controlId="languages">
                          <Form.Label>Languages (comma-separated)</Form.Label>
                          <Form.Control
                            type="text"
                            name="languages"
                            value={formData.languages}
                            onChange={handleInputChange}
                            placeholder="e.g. English, Spanish, French"
                            disabled={modalMode === 'view'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Form.Group className="mb-3" controlId="bio">
                      <Form.Label>Bio/Description</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Professional biography and expertise description"
                        disabled={modalMode === 'view'}
                      />
                    </Form.Group>
                    
                    <Row className="mb-3">
                      <Col md={3}>
                        <Form.Group controlId="rating">
                          <Form.Label>Rating (1-5)</Form.Label>
                          <Form.Control
                            type="number"
                            name="rating"
                            value={formData.rating}
                            onChange={handleInputChange}
                            placeholder="e.g. 4.8"
                            disabled={modalMode === 'view'}
                            min="1"
                            max="5"
                            step="0.1"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group controlId="reviewCount">
                          <Form.Label>Review Count</Form.Label>
                          <Form.Control
                            type="number"
                            name="reviewCount"
                            value={formData.reviewCount}
                            onChange={handleInputChange}
                            placeholder="e.g. 120"
                            disabled={modalMode === 'view'}
                            min="0"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group controlId="successRate">
                          <Form.Label>Success Rate (%)</Form.Label>
                          <Form.Control
                            type="number"
                            name="successRate"
                            value={formData.successRate}
                            onChange={handleInputChange}
                            placeholder="e.g. 95"
                            disabled={modalMode === 'view'}
                            min="0"
                            max="100"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={3}>
                        <Form.Group controlId="consultationFee">
                          <Form.Label>Consultation Fee</Form.Label>
                          <Form.Control
                            type="text"
                            name="consultationFee"
                            value={formData.consultationFee}
                            onChange={handleInputChange}
                            placeholder="e.g. $150"
                            disabled={modalMode === 'view'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="availability">
                          <Form.Label>Availability</Form.Label>
                          <Form.Select
                            name="availability"
                            value={formData.availability}
                            onChange={handleInputChange}
                            disabled={modalMode === 'view'}
                          >
                            <option value="Available now">Available now</option>
                            <option value="Available this week">Available this week</option>
                            <option value="Available next week">Available next week</option>
                            <option value="Limited availability">Limited availability</option>
                            <option value="Fully booked">Fully booked</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="d-flex align-items-end">
                        <Form.Group controlId="verified" className="mb-3">
                          <Form.Check
                            type="checkbox"
                            name="verified"
                            label="Verified Specialist"
                            checked={formData.verified}
                            onChange={handleInputChange}
                            disabled={modalMode === 'view'}
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                  </Form>
                </Tab>
                
                <Tab eventKey="specializations" title="Countries & Visa Types">
                  <Form>
                    {modalMode === 'view' ? (
                      <div>
                        <h6 className="mb-3">Countries of Expertise</h6>
                        <div className="mb-4">
                          {formData.specialization.countries && formData.specialization.countries.length > 0 ? (
                            <div className="d-flex flex-wrap gap-2">
                              {formData.specialization.countries.map((country, idx) => (
                                <Badge key={idx} bg="secondary" className="p-2">{country}</Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-muted">No countries specified</p>
                          )}
                        </div>
                        
                        <h6 className="mb-3">Visa Type Specializations</h6>
                        {formData.specialization.visaTypes && formData.specialization.visaTypes.length > 0 ? (
                          <div className="mb-3">
                            {formData.specialization.visaTypes.map((countryVisa, idx) => (
                              <div key={idx} className="card mb-3">
                                <div className="card-header bg-light">
                                  <strong>{countryVisa.country}</strong>
                                </div>
                                <div className="card-body">
                                  <div className="d-flex flex-wrap gap-2">
                                    {countryVisa.types.map((type, typeIdx) => (
                                      <Badge key={typeIdx} bg="info" className="p-2">{type}</Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted">No visa type specializations specified</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        <div className="mb-4">
                          <h6>Countries of Expertise</h6>
                          <p className="text-muted small">Select countries where this specialist has expertise</p>
                          <div className="border rounded p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <Row>
                              {countries.map((country, idx) => (
                                <Col md={4} key={idx}>
                                  <Form.Check
                                    type="checkbox"
                                    id={`country-${idx}`}
                                    label={country}
                                    value={country}
                                    checked={formData.specialization.countries.includes(country)}
                                    onChange={handleCountryChange}
                                    className="mb-2"
                                  />
                                </Col>
                              ))}
                            </Row>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h6>Visa Type Specializations</h6>
                          <p className="text-muted small">Add visa types by country that this specialist handles</p>
                          
                          <Row className="mb-3 align-items-end">
                            <Col md={4}>
                              <Form.Group>
                                <Form.Label>Select Country</Form.Label>
                                <Form.Select
                                  value={selectedFormCountry}
                                  onChange={(e) => handleFormCountrySelect(e.target.value)}
                                >
                                  <option value="">Choose country...</option>
                                  {formData.specialization.countries.map((country, idx) => (
                                    <option key={idx} value={country}>{country}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={8}>
                              {selectedFormCountry ? (
                                loading.visaTypes ? (
                                  <Spinner animation="border" size="sm" />
                                ) : (
                                  <Button 
                                    variant="outline-primary" 
                                    size="sm"
                                    onClick={handleAddCountryVisaTypes}
                                    disabled={selectedCountryVisaTypes.length === 0}
                                  >
                                    <i className="bi bi-plus-lg me-1"></i> Add Selected Visa Types
                                  </Button>
                                )
                              ) : null}
                            </Col>
                          </Row>
                          
                          {selectedFormCountry && (
                            <div className="border rounded p-3 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                              <h6>{selectedFormCountry} Visa Types</h6>
                              {loading.visaTypes ? (
                                <div className="text-center py-3">
                                  <Spinner animation="border" size="sm" />
                                  <p className="mt-2 small">Loading visa types...</p>
                                </div>
                              ) : countryVisaTypes.length === 0 ? (
                                <p className="text-muted small">No visa types found for this country</p>
                              ) : (
                                <Row>
                                  {countryVisaTypes.map((visa, idx) => (
                                    <Col md={6} key={idx}>
                                      <Form.Check
                                        type="checkbox"
                                        id={`visa-${idx}`}
                                        label={visa.visa_type}
                                        value={visa.visa_type}
                                        checked={selectedCountryVisaTypes.includes(visa.visa_type)}
                                        onChange={handleVisaTypeChange}
                                        className="mb-2"
                                      />
                                    </Col>
                                  ))}
                                </Row>
                              )}
                            </div>
                          )}
                          
                          <div>
                            <h6>Added Specializations</h6>
                            {formData.specialization.visaTypes.length === 0 ? (
                              <p className="text-muted small">No visa specializations added yet</p>
                            ) : (
                              <div>
                                {formData.specialization.visaTypes.map((countryVisa, idx) => (
                                  <div key={idx} className="card mb-3">
                                    <div className="card-header bg-light d-flex justify-content-between align-items-center">
                                      <strong>{countryVisa.country}</strong>
                                      <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        onClick={() => removeCountryVisaTypes(countryVisa.country)}
                                      >
                                        <i className="bi bi-trash"></i>
                                      </Button>
                                    </div>
                                    <div className="card-body">
                                      <div className="d-flex flex-wrap gap-2">
                                        {countryVisa.types.map((type, typeIdx) => (
                                          <Badge key={typeIdx} bg="info" className="p-2">{type}</Badge>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Form>
                </Tab>
              </Tabs>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSpecialistModal(false)}>
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {modalMode !== 'view' && (
                <Button 
                  variant="primary" 
                  onClick={handleSubmitSpecialist}
                  disabled={loading.operations}
                >
                  {loading.operations ? (
                    <>
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                        className="me-1"
                      />
                      Saving...
                    </>
                  ) : (
                    <>{modalMode === 'add' ? 'Add Specialist' : 'Update Specialist'}</>
                  )}
                </Button>
              )}
            </Modal.Footer>
          </Modal>
        </Card>
      );

    }

    export default SpecialistsManagement;