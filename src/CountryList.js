import React from 'react';
import { Card, ListGroup, InputGroup, FormControl } from 'react-bootstrap';
import { useState } from 'react';

function CountryList({ countries, selectedCountry, onSelectCountry }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCountries = countries.filter(country => 
    country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-sm">
      <Card.Header className="green-header">
        <h5 className="my-1">
          <i className="fas fa-globe-americas me-2"></i>
          Countries
        </h5>
      </Card.Header>
      <Card.Body className="p-2">
        <InputGroup className="mb-2">
          <InputGroup.Text id="search-icon">
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <FormControl
            placeholder="Search countries..."
            aria-label="Search countries"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
      </Card.Body>
      <div className="country-list">
        <ListGroup variant="flush">
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country, index) => (
              <ListGroup.Item
                key={index}
                active={selectedCountry === country}
                onClick={() => onSelectCountry(country)}
                className="d-flex align-items-center"
              >
                <i className={`fas fa-flag me-2 ${selectedCountry === country ? 'text-white' : 'text-muted'}`}></i>
                {country}
              </ListGroup.Item>
            ))
          ) : (
            <ListGroup.Item className="text-center py-3">
              {searchTerm ? 'No matching countries found' : 'No countries available'}
            </ListGroup.Item>
          )}
        </ListGroup>
      </div>
    </Card>
  );
}

export default CountryList;