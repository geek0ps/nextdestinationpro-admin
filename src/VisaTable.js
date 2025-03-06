import React from 'react';
import { Card, Table, Button, ButtonGroup, Badge } from 'react-bootstrap';

function VisaTable({
  visaTypes,
  selectedCountry,
  selectedVisa,
  onSelectVisa,
  onAddVisa,
  onEditVisa,
  onPreviewVisa,
  onDeleteVisa
}) {
  const getEligibleApplicantsText = (applicants) => {
    if (!Array.isArray(applicants) || applicants.length === 0) return 'N/A';
    if (applicants.length === 1) return applicants[0];
    return `${applicants[0]} + ${applicants.length - 1} more`;
  };

  return (
    <Card className="shadow-sm h-100">
      <Card.Header className="green-header d-flex justify-content-between align-items-center">
        <h5 className="my-1">
          <i className="fas fa-id-card me-2"></i>
          Visa Types {selectedCountry && `for ${selectedCountry}`}
        </h5>
        <ButtonGroup>
          <Button 
            variant="light" 
            className="d-flex align-items-center" 
            onClick={onAddVisa} 
            disabled={!selectedCountry}
          >
            <i className="fas fa-plus me-1"></i> Add
          </Button>
          <Button 
            variant="light" 
            className="d-flex align-items-center" 
            onClick={onEditVisa} 
            disabled={!selectedVisa}
          >
            <i className="fas fa-edit me-1"></i> Edit
          </Button>
          <Button 
            variant="light" 
            className="d-flex align-items-center" 
            onClick={onPreviewVisa} 
            disabled={!selectedVisa}
          >
            <i className="fas fa-eye me-1"></i> View
          </Button>
          <Button 
            variant="light" 
            className="d-flex align-items-center text-danger" 
            onClick={onDeleteVisa} 
            disabled={!selectedVisa}
          >
            <i className="fas fa-trash-alt me-1"></i> Delete
          </Button>
        </ButtonGroup>
      </Card.Header>
      <div className="visa-table-container">
        <Table hover responsive>
          <thead>
            <tr>
              <th>Visa Type</th>
              <th>Description</th>
              <th>Eligible Applicants</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visaTypes.length > 0 ? (
              visaTypes.map((visa, index) => (
                <tr
                  key={index}
                  onClick={() => onSelectVisa(visa)}
                  className={selectedVisa === visa.visa_type ? 'table-primary' : ''}
                >
                  <td className="fw-bold">
                    <i className={`fas fa-passport me-2 ${selectedVisa === visa.visa_type ? 'text-primary' : 'text-muted'}`}></i>
                    {visa.visa_type}
                  </td>
                  <td>{visa.description}</td>
                  <td>{getEligibleApplicantsText(visa.eligible_applicants)}</td>
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
                      <Badge bg="primary" pill>Standard</Badge>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4">
                  {selectedCountry ? (
                    <div>
                      <i className="fas fa-folder-open text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                      <p className="mb-0">No visa types found for {selectedCountry}</p>
                      <Button variant="primary" size="sm" className="mt-2" onClick={onAddVisa}>
                        <i className="fas fa-plus me-1"></i> Add New Visa
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <i className="fas fa-globe text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                      <p className="mb-0">Select a country to view visa types</p>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
}

export default VisaTable;