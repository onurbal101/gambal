import React from "react";
import { LinkContainer } from "react-router-bootstrap";
import { Navbar, Nav, Container } from "react-bootstrap";

const Header = () => {
  return (
    <header>
      <Navbar bg="primary" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          <LinkContainer to="/">
            <Navbar.Brand>GamBAL</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <LinkContainer to="/">
                <Nav.Link>Home</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/evaluator">
                <Nav.Link>Evaluator</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/player">
                <Nav.Link>Player</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/customisation">
                <Nav.Link>Customisation</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/results">
                <Nav.Link>Results</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/history">
                <Nav.Link>History</Nav.Link>
              </LinkContainer>
              <LinkContainer to="/game">
                <Nav.Link>Play</Nav.Link>
              </LinkContainer>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </header>
  );
};

export default Header;
