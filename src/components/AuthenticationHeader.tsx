import { Button, Col, Row, Spinner } from "react-bootstrap";
import { User } from "firebase/auth";

interface AuthenticationHeaderProps {
  user: User | null;
  authLoading: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
}

const AuthenticationHeader: React.FC<AuthenticationHeaderProps> = ({
  user,
  authLoading,
  onSignIn,
  onSignOut,
}) => {
  return (
    <Row className="mb-4 d-flex align-items-center justify-content-between">
      <Col>
        <h1>Sunday School Attendance</h1>
      </Col>
      <Col xs="auto">
        {user ? (
          <Button
            variant="outline-secondary"
            onClick={onSignOut}
            className="d-flex align-items-center"
          >
            <span className="me-2">{user.displayName || user.email}</span>
            Sign Out
          </Button>
        ) : (
          <Button variant="primary" onClick={onSignIn} disabled={authLoading}>
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
      </Col>
    </Row>
  );
};

export default AuthenticationHeader;
