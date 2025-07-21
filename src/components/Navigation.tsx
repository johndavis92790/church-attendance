import { Nav } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <Nav variant="tabs" className="mb-4">
      <Nav.Item>
        <Nav.Link
          as={Link}
          to="/attendance"
          active={location.pathname === "/attendance"}
        >
          Attendance
        </Nav.Link>
      </Nav.Item>
      <Nav.Item>
        <Nav.Link as={Link} to="/users" active={location.pathname === "/users"}>
          Manage Users
        </Nav.Link>
      </Nav.Item>
    </Nav>
  );
};

export default Navigation;
