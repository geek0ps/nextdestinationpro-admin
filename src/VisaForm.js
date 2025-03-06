import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Badge } from 'react-bootstrap';

function VisaForm({ show, mode, selectedCountry, visaData, onHide, onSubmit }) {
  const [formData, setFormData] = useState({
    visa_type: '',
    description: '',
    eligible_applicants: '',
    duration: '',
    exempted_countries: '',
    restricted_countries: ''
  });
  
  const [validated, setValidated] = useState(false);

  // Update form when editing existing visa
  useEffect(() => {
    if (mode === 'edit' && visaData) {
      setFormData({
        visa_type: visaData.visa_type,
        description: visaData.description,
        eligible_applicants: Array.isArray(visaData.eligible_applicants) 
          ? visaData.eligible_applicants.join(', ') 
          : visaData.eligible_applicants,
        duration: visaData.duration,
        exempted_countries: Array.isArray(visaData.exempted_countries) 
          ? visaData.exempted_countries.join(', ') 
          : visaData.exempted_countries,
        restricted_countries: Array.isArray(visaData.restricted_countries) 
          ? visaData.restricted_countries.join(', ') 
          : visaData.restricted_countries
      });
    } else if (mode === 'add') {
      // Reset form for adding new visa
      setFormData({
        visa_type: '',
        description: '',
        eligible_applicants: '',
        duration: '',
        exempted_countries: '',
        restricted_countries: ''
      });
    }
    setValidated(false);
  }, [mode, visaData, show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    
    // Form validation
    if (form.checkValidity() === false) {
      e.stopPropagation();
      setValidated(true);
      return;
    }
    
    // Format arrays from comma-separated strings
    const formattedData = {
      ...formData,
      eligible_applicants: formData.eligible_applicants.split(',').map(item => item.trim())
        .filter(item => item !== ''),
      exempted_countries: formData.exempted_countries.split(',').map(item => item.trim())
        .filter(item => item !== ''),
      restricted_countries: formData.restricted_countries.split(',').map(item => item.trim())
        .filter(item => item !== '')
    };
    
    onSubmit(formattedData);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="green-header">
        <Modal.Title>
          {mode === 'add' ? (
            <>
              <i className="fas fa-plus-circle me-2"></i>
              Add New Visa Type
            </>
          ) : (
            <>
              <i className="fas fa-edit me-2"></i>
              Edit Visa Type
            </>
          )}
        </Modal.Title>
      </Modal.Header>
      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          <Row className="mb-3">
            <Col md={12}>
              <h6 className="text-muted mb-3">
                <i className="fas fa-info-circle me-2"></i>
                {mode === 'add' ? 'Creating new visa type for' : 'Editing visa type for'} 
                <Badge bg="primary" className="ms-2">{selectedCountry}</Badge>
              </h6>
            </Col>
          </Row>
          
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group controlId="visaType">
                <Form.Label>Visa Type</Form.Label>
                <Form.Control
                  type="text"
                  name="visa_type"
                  value={formData.visa_type}
                  onChange={handleInputChange}
                  disabled={mode === 'edit'}
                  required
                  placeholder="e.g. B-1/B-2"
                />
                <Form.Control.Feedback type="invalid">
                  Visa type is required
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={8}>
              <Form.Group controlId="duration">
                <Form.Label>Duration</Form.Label>
                <Form.Control
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Up to 6 months, may be extended"
                />
                <Form.Control.Feedback type="invalid">
                  Duration is required
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3" controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="Detailed description of the visa type"
            />
            <Form.Control.Feedback type="invalid">
              Description is required
            </Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3" controlId="eligibleApplicants">
            <Form.Label>Eligible Applicants (comma-separated)</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              name="eligible_applicants"
              value={formData.eligible_applicants}
              onChange={handleInputChange}
              required
              placeholder="e.g. Business travelers, Tourists, Visiting family/friends"
            />
            <Form.Control.Feedback type="invalid">
              At least one eligible applicant is required
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              List all eligible groups separated by commas
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
                  placeholder="e.g. Canada, Mexico, United Kingdom"
                />
                <Form.Text className="text-muted">
                  Countries exempt from visa requirements
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
                  placeholder="e.g. North Korea, Iran, Syria"
                />
                <Form.Text className="text-muted">
                  Countries with special restrictions for this visa
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            <i className="fas fa-times me-1"></i> Cancel
          </Button>
          <Button type="submit" variant="primary">
            <i className="fas fa-save me-1"></i> {mode === 'add' ? 'Add Visa Type' : 'Update Visa Type'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default VisaForm;