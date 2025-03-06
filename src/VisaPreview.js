import React from 'react';
import { Modal, Button, Card, ListGroup, Row, Col, Badge } from 'react-bootstrap';

function VisaPreview({ show, country, visaData, onHide }) {
  if (!visaData) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="green-header">
        <Modal.Title>
          <i className="fas fa-eye me-2"></i>
          Visa Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <Card className="modal-preview-card">
          <Card.Header>
            <h3 className="mb-1">{visaData.visa_type}</h3>
            <div className="d-flex align-items-center">
              <i className="fas fa-globe me-2"></i>
              <span>{country}</span>
            </div>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={8}>
                <h5 className="card-subtitle">
                  <i className="fas fa-info-circle me-2"></i>
                  Description
                </h5>
                <p className="mb-4">{visaData.description}</p>
                
                <h5 className="card-subtitle">
                  <i className="fas fa-clock me-2"></i>
                  Duration
                </h5>
                <p className="mb-4">{visaData.duration}</p>
                
                <h5 className="card-subtitle">
                  <i className="fas fa-users me-2"></i>
                  Eligible Applicants
                </h5>
                <ListGroup variant="flush" className="mb-4">
                  {Array.isArray(visaData.eligible_applicants) && visaData.eligible_applicants.map((applicant, index) => (
                    <ListGroup.Item key={index} className="px-0 py-1 border-0">
                      <i className="fas fa-check-circle text-success me-2"></i>
                      {applicant}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Col>
              
              <Col md={4}>
                <Card className="bg-light border-0 mb-3">
                  <Card.Body>
                    <h6 className="mb-2">
                      <i className="fas fa-clipboard-list me-2"></i>
                      Status
                    </h6>
                    <div className="d-flex flex-column">
                      <Badge bg="primary" className="py-2 px-3 mb-2">
                        <i className="fas fa-passport me-2"></i>
                        {visaData.visa_type}
                      </Badge>
                      <Badge bg={visaData.exempted_countries && visaData.exempted_countries.length > 0 ? "success" : "secondary"} className="py-2 px-3">
                        <i className="fas fa-check-circle me-2"></i>
                        {visaData.exempted_countries && visaData.exempted_countries.length > 0 
                          ? `${visaData.exempted_countries.length} Exempted Countries` 
                          : "No Exemptions"}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
                
                {Array.isArray(visaData.exempted_countries) && visaData.exempted_countries.length > 0 && (
                  <>
                    <h5 className="card-subtitle">
                      <i className="fas fa-flag me-2"></i>
                      Exempted Countries
                    </h5>
                    <ListGroup variant="flush" className="mb-3">
                      {visaData.exempted_countries.map((country, index) => (
                        <ListGroup.Item key={index} className="px-0 py-1 border-0">
                          <i className="fas fa-check text-success me-2"></i>
                          {country}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </>
                )}
                
                {Array.isArray(visaData.restricted_countries) && visaData.restricted_countries.length > 0 && (
                  <>
                    <h5 className="card-subtitle">
                      <i className="fas fa-ban me-2"></i>
                      Restricted Countries
                    </h5>
                    <ListGroup variant="flush" className="mb-3">
                      {visaData.restricted_countries.map((country, index) => (
                        <ListGroup.Item key={index} className="px-0 py-1 border-0">
                          <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                          {country}
                        </ListGroup.Item>
                      ))}
                    </ListGroup>
                  </>
                )}
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-1"></i> Close
        </Button>
        <Button variant="primary">
          <i className="fas fa-print me-1"></i> Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default VisaPreview;