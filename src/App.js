import React, { useState, useEffect } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, Modal, Alert,
  Navbar, Nav, Dropdown, ListGroup, Badge, Spinner, Tabs, Tab
} from 'react-bootstrap';
import './NextDestinationAdmin.css';
import apiService from './services/api';
import logo from './logo.svg'; // Make sure to have this file in your assets folder
import SpecialistsManagement from './SpecialistsManagement';

function App() {
  // State for active tab
  const [activeTab, setActiveTab] = useState('visas'); // 'visas' or 'specialists'
  
  // State for countries and selection
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for visa types and selection
  const [visaTypes, setVisaTypes] = useState([]);
  const [selectedVisa, setSelectedVisa] = useState(null);
  
  // State for modal and form
  const [showVisaModal, setShowVisaModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    visa_type: '',
    description: '',
    eligible_applicants: '',
    duration: '',
    exempted_countries: '',
    restricted_countries: ''
  });
  
  // State for UI feedback
  const [alert, setAlert] = useState({ show: false, variant: 'success', message: '' });
  const [loading, setLoading] = useState({
    countries: false,
    visaTypes: false,
    operations: false
  });
  const [error, setError] = useState({
    countries: null,
    visaTypes: null,
    operations: null
  });
  
  // State for UI layout
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch all countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch visa types when a country is selected
  useEffect(() => {
    if (selectedCountry) {
      fetchVisaTypes(selectedCountry);
    } else {
      setVisaTypes([]);
      setSelectedVisa(null);
    }
  }, [selectedCountry]);

  // API Functions
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
    } finally {
      setLoading(prev => ({ ...prev, countries: false }));
    }
  };

  const fetchVisaTypes = async (country) => {
    setLoading(prev => ({ ...prev, visaTypes: true }));
    setError(prev => ({ ...prev, visaTypes: null }));
    
    try {
      const visaData = await apiService.getVisaTypes(country);
      setVisaTypes(visaData);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        visaTypes: error.response?.data?.message || error.message || `Failed to fetch visa types for ${country}` 
      }));
      showAlert('danger', `Error fetching visa types: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, visaTypes: false }));
    }
  };

  // Event Handlers
  const handleCountrySelect = (country) => {
    setSelectedCountry(country);
    setSelectedVisa(null);
  };

  const handleVisaSelect = (visa) => {
    setSelectedVisa(visa);
    const visaData = visaTypes.find(v => v.visa_type === visa);
    
    if (visaData) {
      setFormData({
        visa_type: visaData.visa_type || '',
        description: visaData.description || '',
        eligible_applicants: Array.isArray(visaData.eligible_applicants) 
          ? visaData.eligible_applicants.join(', ') 
          : (typeof visaData.eligible_applicants === 'string' ? visaData.eligible_applicants : ''),
        duration: visaData.duration || '',
        exempted_countries: Array.isArray(visaData.exempted_countries) 
          ? visaData.exempted_countries.join(', ') 
          : (typeof visaData.exempted_countries === 'string' ? visaData.exempted_countries : ''),
        restricted_countries: Array.isArray(visaData.restricted_countries) 
          ? visaData.restricted_countries.join(', ') 
          : (typeof visaData.restricted_countries === 'string' ? visaData.restricted_countries : '')
      });
    }
  };

  const handleAddVisa = () => {
    setModalMode('add');
    setFormData({
      visa_type: '',
      description: '',
      eligible_applicants: '',
      duration: '',
      exempted_countries: '',
      restricted_countries: ''
    });
    setShowVisaModal(true);
  };

  const handleEditVisa = () => {
    if (!selectedVisa) {
      showAlert('warning', 'Please select a visa to edit');
      return;
    }
    setModalMode('edit');
    setShowVisaModal(true);
  };

  const handleDeleteVisa = async () => {
    if (!selectedVisa) {
      showAlert('warning', 'Please select a visa to delete');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedVisa}?`)) {
      setLoading(prev => ({ ...prev, operations: true }));
      setError(prev => ({ ...prev, operations: null }));
      
      try {
        await apiService.deleteVisa(selectedCountry, selectedVisa);
        showAlert('success', `Successfully deleted ${selectedVisa}`);
        
        // Refresh visa types after deletion
        fetchVisaTypes(selectedCountry);
        setSelectedVisa(null);
      } catch (error) {
        setError(prev => ({ 
          ...prev, 
          operations: error.response?.data?.message || error.message || 'Failed to delete visa' 
        }));
        showAlert('danger', `Error deleting visa: ${error.message}`);
      } finally {
        setLoading(prev => ({ ...prev, operations: false }));
      }
    }
  };

  const handleSubmitVisa = async () => {
    // Validate required fields
    if (!formData.visa_type || !formData.description || !formData.duration || !formData.eligible_applicants) {
      showAlert('danger', 'Visa type, description, duration, and eligible applicants are required fields');
      return;
    }
    
    setLoading(prev => ({ ...prev, operations: true }));
    setError(prev => ({ ...prev, operations: null }));
    
    try {
      // Format arrays from comma-separated strings
      const formattedData = {
        ...formData,
        eligible_applicants: typeof formData.eligible_applicants === 'string' 
          ? formData.eligible_applicants.split(',').map(item => item.trim()).filter(item => item !== '')
          : formData.eligible_applicants,
        exempted_countries: typeof formData.exempted_countries === 'string'
          ? formData.exempted_countries.split(',').map(item => item.trim()).filter(item => item !== '')
          : formData.exempted_countries,
        restricted_countries: typeof formData.restricted_countries === 'string'
          ? formData.restricted_countries.split(',').map(item => item.trim()).filter(item => item !== '')
          : formData.restricted_countries
      };
  
      if (modalMode === 'add') {
        await apiService.createVisa(selectedCountry, formattedData);
        showAlert('success', `Successfully added ${formData.visa_type}`);
      } else {
        await apiService.updateVisa(selectedCountry, selectedVisa, formattedData);
        showAlert('success', `Successfully updated ${formData.visa_type}`);
      }
  
      // Refresh visa types after adding or updating
      fetchVisaTypes(selectedCountry);
      setShowVisaModal(false);
    } catch (error) {
      setError(prev => ({ 
        ...prev, 
        operations: error.response?.data?.message || error.message || 'Failed to save visa data' 
      }));
      showAlert('danger', `Error ${modalMode === 'add' ? 'adding' : 'updating'} visa: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, operations: false }));
    }
  };
  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const showAlert = (variant, message) => {
    setAlert({ show: true, variant, message });
    setTimeout(() => {
      setAlert({ show: false, variant, message });
    }, 5000);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  // Filter countries based on search term
  const filteredCountries = searchTerm.trim() === '' 
    ? countries 
    : countries.filter(country => 
        country.toLowerCase().includes(searchTerm.toLowerCase())
      );

  return (
    <div className="ndp-admin-wrapper">
      {/* Top Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="ndp-navbar">
        <Container fluid>
          <Button 
            variant="outline-light" 
            className="sidebar-toggle me-2"
            onClick={toggleSidebar}
          >
            <i className="bi bi-list"></i>
          </Button>
          <Navbar.Brand href="#home" className="d-flex align-items-center">
            <img 
              src={logo} 
              height="30" 
              className="d-inline-block align-top me-2" 
              alt="NextDestinationPro Logo" 
            />
            <span className="brand-text">Visa Admin Portal</span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav" className="justify-content-end">
            <Nav>
              <Nav.Link href="#dashboard" active>Dashboard</Nav.Link>
              <Nav.Link href="#reports">Reports</Nav.Link>
              <Nav.Link href="#settings">Settings</Nav.Link>
              <Dropdown align="end">
                <Dropdown.Toggle variant="dark" id="dropdown-admin" className="profile-dropdown">
                  <i className="bi bi-person-circle me-1"></i> Admin
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#profile">Profile</Dropdown.Item>
                  <Dropdown.Item href="#preferences">Preferences</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="#logout">Logout</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="ndp-content-wrapper">
        {/* Sidebar */}
        <div className={`ndp-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-header">
            <h5>Navigation</h5>
          </div>
          <Nav className="flex-column sidebar-nav">
            <Nav.Link href="#dashboard">
              <i className="bi bi-speedometer2 me-2"></i> Dashboard
            </Nav.Link>
            <Nav.Link
              href="#visas"
              active={activeTab === 'visas'}
              onClick={() => setActiveTab('visas')}
            >
              <i className="bi bi-file-earmark-text me-2"></i> Visa Management
            </Nav.Link>
            <Nav.Link
              href="#specialists"
              active={activeTab === 'specialists'}
              onClick={() => setActiveTab('specialists')}
            >
              <i className="bi bi-people me-2"></i> Specialists
            </Nav.Link>
            <Nav.Link href="#countries">
              <i className="bi bi-globe me-2"></i> Countries
            </Nav.Link>
            <Nav.Link href="#users">
              <i className="bi bi-people me-2"></i> Users
            </Nav.Link>
            <Nav.Link href="#reports">
              <i className="bi bi-bar-chart me-2"></i> Reports
            </Nav.Link>
            <Nav.Link href="#settings">
              <i className="bi bi-gear me-2"></i> Settings
            </Nav.Link>
          </Nav>
        </div>

        {/* Main Content */}
        <div className={`ndp-main-content ${sidebarCollapsed ? 'expanded' : ''}`}>
          <Container fluid className="p-3">
            {alert.show && (
              <Alert variant={alert.variant} onClose={() => setAlert({...alert, show: false})} dismissible>
                <i className={`bi bi-${alert.variant === 'success' ? 'check-circle' : 
                              alert.variant === 'danger' ? 'exclamation-circle' : 
                              alert.variant === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2`}></i>
                {alert.message}
              </Alert>
            )}
            
            <Row className="mb-3">
              <Col>
                <div className="page-header">
                  <h3>{activeTab === 'visas' ? 'Visa Management' : 'Specialist Management'}</h3>
                  <p className="text-muted">
                    {activeTab === 'visas' 
                      ? 'Manage visa types, requirements, and country-specific information' 
                      : 'Manage visa specialists, their expertise, and country specializations'}
                  </p>
                </div>
              </Col>
            </Row>
            
            {activeTab === 'visas' ? (
              <Row>
                <Col md={3} lg={3} xl={2} className="mb-4">
                  <Card className="ndp-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">Countries</h5>
                      {!loading.countries && (
                        <Badge bg="primary" pill>{filteredCountries.length}</Badge>
                      )}
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="search-box p-2">
                        <Form.Control
                          type="text"
                          placeholder="Search countries..."
                          className="search-input"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="country-list">
                        {loading.countries ? (
                          <div className="text-center py-5">
                            <Spinner animation="border" variant="primary" />
                            <p className="mt-2">Loading countries...</p>
                          </div>
                        ) : error.countries ? (
                          <div className="text-center py-5">
                            <i className="bi bi-exclamation-triangle text-danger display-1"></i>
                            <p className="mt-3 mb-0">Error loading countries</p>
                            <p className="text-muted">{error.countries}</p>
                            <Button 
                              variant="primary" 
                              size="sm" 
                              className="mt-2"
                              onClick={fetchCountries}
                            >
                              <i className="bi bi-arrow-clockwise me-1"></i> Retry
                            </Button>
                          </div>
                        ) : filteredCountries.length === 0 ? (
                          <div className="text-center py-5">
                            <i className="bi bi-search text-muted display-4"></i>
                            <p className="mt-3">No countries match your search</p>
                            <Button 
                              variant="outline-secondary" 
                              size="sm"
                              onClick={() => setSearchTerm('')}
                            >
                              Clear search
                            </Button>
                          </div>
                        ) : (
                          <ListGroup variant="flush">
                            {filteredCountries.map((country, index) => (
                              <ListGroup.Item
                                key={index}
                                action
                                active={selectedCountry === country}
                                onClick={() => handleCountrySelect(country)}
                                className="country-item"
                              >
                                <i className="bi bi-globe me-2"></i>
                                {country}
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                
                <Col md={9} lg={9} xl={10}>
                  <Card className="ndp-card">
                    <Card.Header className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0">
                        {selectedCountry ? `Visa Types for ${selectedCountry}` : 'Select a Country'}
                      </h5>
                      <div>
                        <Button 
                          variant="primary" 
                          onClick={handleAddVisa} 
                          disabled={!selectedCountry || loading.operations}
                          className="me-2"
                        >
                          <i className="bi bi-plus-lg me-1"></i> Add New Visa
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          onClick={handleEditVisa} 
                          disabled={!selectedVisa || loading.operations}
                          className="me-2"
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          onClick={handleDeleteVisa} 
                          disabled={!selectedVisa || loading.operations}
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
                      {!selectedCountry ? (
                        <div className="text-center py-5">
                          <i className="bi bi-arrow-left-circle text-muted display-1"></i>
                          <p className="mt-3">Please select a country to view visa types</p>
                        </div>
                      ) : loading.visaTypes ? (
                        <div className="text-center py-5">
                          <Spinner animation="border" variant="primary" />
                          <p className="mt-2">Loading visa types...</p>
                        </div>
                      ) : error.visaTypes ? (
                        <div className="text-center py-5">
                          <i className="bi bi-exclamation-triangle text-danger display-1"></i>
                          <p className="mt-3 mb-0">Error loading visa types</p>
                          <p className="text-muted">{error.visaTypes}</p>
                          <Button 
                            variant="primary" 
                            size="sm" 
                            className="mt-2"
                            onClick={() => fetchVisaTypes(selectedCountry)}
                          >
                            <i className="bi bi-arrow-clockwise me-1"></i> Retry
                          </Button>
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <Table hover className="visa-table">
                            <thead>
                              <tr>
                                <th>Visa Type</th>
                                <th>Description</th>
                                <th>Eligible Applicants</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {visaTypes.length > 0 ? (
                                visaTypes.map((visa, index) => (
                                  <tr
                                    key={index}
                                    onClick={() => handleVisaSelect(visa.visa_type)}
                                    className={selectedVisa === visa.visa_type ? 'selected-row' : ''}
                                  >
                                    <td className="visa-type-cell">
                                      <div className="d-flex align-items-center">
                                        <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                                        <span className="fw-bold">{visa.visa_type}</span>
                                      </div>
                                    </td>
                                    <td>{visa.description}</td>
                                    <td>
                                      {Array.isArray(visa.eligible_applicants) && 
                                        visa.eligible_applicants.length > 0 ? (
                                          visa.eligible_applicants.length > 1 ? 
                                            `${visa.eligible_applicants[0]} +${visa.eligible_applicants.length - 1} more` :
                                            visa.eligible_applicants[0]
                                        ) : 'N/A'
                                      }
                                    </td>
                                    <td>{visa.duration}</td>
                                    <td>
                                      {visa.exempted_countries && visa.exempted_countries.length > 0 ? (
                                        <Badge bg="success" pill>
                                          {visa.exempted_countries.length} exempted
                                        </Badge>
                                      ) : visa.restricted_countries && visa.restricted_countries.length > 0 ? (
                                        <Badge bg="warning" text="dark" pill>
                                          {visa.restricted_countries.length} restricted
                                        </Badge>
                                      ) : (
                                        <Badge bg="info" pill>Standard</Badge>
                                      )}
                                    </td>
                                    <td>
                                      <Button 
                                        variant="outline-info" 
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation(); // Prevent row selection
                                          // Navigate to experts for this visa type
                                          setActiveTab('specialists');
                                        }}
                                      >
                                        <i className="bi bi-people me-1"></i> Experts
                                      </Button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="6" className="text-center py-4">
                                    <i className="bi bi-exclamation-circle text-muted display-4"></i>
                                    <p className="mt-3 mb-2">No visa types found for {selectedCountry}</p>
                                    <Button 
                                      variant="primary" 
                                      size="sm"
                                      onClick={handleAddVisa}
                                    >
                                      <i className="bi bi-plus-lg me-1"></i> Add New Visa
                                    </Button>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </Table>
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            ) : (
              <SpecialistsManagement />
            )}
          </Container>
        </div>
      </div>

      {/* Add/Edit Visa Modal */}
      <Modal
        show={showVisaModal}
        onHide={() => setShowVisaModal(false)}
        size="lg"
        centered
        className="ndp-modal"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'add' ? (
              <><i className="bi bi-plus-circle me-2"></i>Add New Visa Type</>
            ) : (
              <><i className="bi bi-pencil me-2"></i>Edit Visa Type</>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row className="mb-3">
              <Col md={12}>
                <div className="country-badge">
                  <i className="bi bi-globe me-2"></i>
                  {selectedCountry}
                </div>
              </Col>
            </Row>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="visaType">
                  <Form.Label>Visa Type <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="visa_type"
                    value={formData.visa_type}
                    onChange={handleInputChange}
                    disabled={modalMode === 'edit'}
                    placeholder="e.g. B-1/B-2, Tourist Visa"
                    required
                  />
                  <Form.Text className="text-muted">
                    The official visa designation or name
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="duration">
                  <Form.Label>Duration <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="text"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="e.g. Up to 6 months, may be extended"
                    required
                  />
                  <Form.Text className="text-muted">
                    How long the visa is valid for
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3" controlId="description">
              <Form.Label>Description <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Detailed description of the visa type"
                required
              />
              <Form.Text className="text-muted">
                A clear explanation of the visa's purpose and use
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="eligibleApplicants">
              <Form.Label>Eligible Applicants (comma-separated) <span className="text-danger">*</span></Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="eligible_applicants"
                value={formData.eligible_applicants}
                onChange={handleInputChange}
                placeholder="e.g. Business travelers, Tourists, Visiting family/friends"
                required
              />
              <Form.Text className="text-muted">
                List all types of travelers eligible for this visa, separated by commas
              </Form.Text>
            </Form.Group>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group controlId="exemptedCountries">
                  <Form.Label>Exempted Countries (comma-separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="exempted_countries"
                    value={formData.exempted_countries}
                    onChange={handleInputChange}
                    placeholder="e.g. Canada, Australia, United Kingdom"
                  />
                  <Form.Text className="text-muted">
                    Countries whose citizens don't need this visa
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="restrictedCountries">
                  <Form.Label>Restricted Countries (comma-separated)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="restricted_countries"
                    value={formData.restricted_countries}
                    onChange={handleInputChange}
                    placeholder="e.g. North Korea, Syria, Iran"
                  />
                  <Form.Text className="text-muted">
                    Countries whose citizens face special restrictions
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVisaModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmitVisa}
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
              <>{modalMode === 'add' ? 'Add Visa Type' : 'Update Visa Type'}</>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default App;