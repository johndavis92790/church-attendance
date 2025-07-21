import React, { useState } from "react";
import { Navbar, Nav, Offcanvas, Button, Spinner } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { User } from "firebase/auth";

interface HamburgerMenuProps {
  user: User | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({
  user,
  authLoading,
  onSignIn,
  onSignOut,
}) => {
  const [show, setShow] = useState(false);
  const location = useLocation();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleNavClick = () => {
    handleClose();
  };

  return (
    <>
      <Navbar bg="light" expand={false} className="mb-4">
        <Navbar.Brand href="#" className="fw-bold ms-3">
          Sunday School Attendance
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="offcanvasNavbar"
          onClick={handleShow}
          className="border-0 me-3"
        />
      </Navbar>

      <Offcanvas
        show={show}
        onHide={handleClose}
        placement="end"
        className="me-3"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {/* User Info */}
          {user && (
            <div className="mb-4 p-3 bg-light rounded">
              <div className="fw-bold text-muted small">Signed in as:</div>
              <div className="fw-semibold">
                {user.displayName || user.email}
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {user && (
            <Nav className="flex-column mb-4">
              <Nav.Link
                as={Link}
                to="/attendance"
                active={location.pathname === "/attendance"}
                onClick={handleNavClick}
                className="py-3 px-0 border-bottom"
              >
                📋 Attendance
              </Nav.Link>
              <Nav.Link
                as={Link}
                to="/users"
                active={location.pathname === "/users"}
                onClick={handleNavClick}
                className="py-3 px-0 border-bottom"
              >
                👥 Manage Users
              </Nav.Link>
            </Nav>
          )}

          {/* Authentication Button */}
          <div className="mt-auto">
            {user ? (
              <Button
                variant="outline-danger"
                onClick={() => {
                  onSignOut();
                  handleClose();
                }}
                className="w-100"
                disabled={authLoading}
              >
                {authLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Signing out...
                  </>
                ) : (
                  "Sign Out"
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  onSignIn();
                  handleClose();
                }}
                className="w-100"
                disabled={authLoading}
              >
                {authLoading ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Loading...
                  </>
                ) : (
                  "Sign in with Google"
                )}
              </Button>
            )}
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default HamburgerMenu;
