import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Spinner,
  Button,
} from "react-bootstrap";

function App() {
  const [names, setNames] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // Always use the deployed Cloud Function URL since we're not running a local emulator
  const [functionUrl] = useState<string>(
    "https://us-central1-church-attendance-46a04.cloudfunctions.net/getAttendanceNames",
  );
  const [authRequired, setAuthRequired] = useState<boolean>(false);

  const fetchAttendanceNames = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching names from:", functionUrl);

      // Use the fetch API with mode: 'cors' explicitly set
      const response = await fetch(functionUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        console.error("Response not OK:", response.status, response.statusText);

        if (response.status === 403) {
          setAuthRequired(true);
          throw new Error(
            "Access to this function requires authentication. Please configure Firebase function permissions.",
          );
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      }

      const data = await response.json();
      console.log("Attendance names received:", data);

      if (data && Array.isArray(data.names)) {
        setNames(data.names);
      } else {
        console.error("Invalid data format received:", data);
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching attendance names:", err);
      setError(
        `Failed to load attendance names: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Call the fetch function when component mounts
    fetchAttendanceNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">Church Sunday School Attendance</h1>
        </Col>
      </Row>

      <Row>
        <Col md={{ span: 6, offset: 3 }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3>Attendance Names</h3>
            <Button
              variant="outline-primary"
              onClick={fetchAttendanceNames}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span className="ms-2">Loading...</span>
                </>
              ) : (
                "Refresh List"
              )}
            </Button>
          </div>

          {loading && !names.length ? (
            <div className="text-center mt-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : authRequired ? (
            <div className="alert alert-warning">
              <h4>Firebase Function Authentication Required</h4>
              <p>The Cloud Function requires authentication. To fix this:</p>
              <ol>
                <li>
                  Go to the{" "}
                  <a
                    href="https://console.firebase.google.com/project/church-attendance-46a04/functions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Firebase Console Functions page
                  </a>
                </li>
                <li>
                  Find the <code>getAttendanceNames</code> function
                </li>
                <li>Click the three dots menu (⋮) on the right</li>
                <li>Select "Permissions"</li>
                <li>
                  Add a new permission for "allUsers" with the role "Cloud
                  Functions Invoker"
                </li>
              </ol>
              <p>
                After setting permissions, click the refresh button to try
                again.
              </p>
            </div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : names.length > 0 ? (
            <ListGroup>
              {names.map((name, index) => (
                <ListGroup.Item key={index}>{name}</ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="alert alert-warning">
              No names found. Try refreshing the list.
            </div>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default App;
