import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  Container,
  Row,
  Col,
  ListGroup,
  Spinner,
  Button,
  Form,
  Alert,
} from "react-bootstrap";
import { format } from "date-fns";

// Define interfaces for our data types
interface AttendanceRecord {
  name: string;
  present: boolean;
}

function App() {
  // State for the list of names and their attendance status
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // State for date selection - default to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // URLs for our Cloud Functions
  const [namesUrl] = useState<string>(
    "https://us-central1-church-attendance-46a04.cloudfunctions.net/getAttendanceNames",
  );
  const [saveUrl] = useState<string>(
    "https://us-central1-church-attendance-46a04.cloudfunctions.net/saveAttendance",
  );
  const [authRequired, setAuthRequired] = useState<boolean>(false);

  // Function to fetch attendance names from the Cloud Function
  const fetchAttendanceNames = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      setSaveError(null);

      console.log("Fetching names from:", namesUrl);

      // Use the fetch API with mode: 'cors' explicitly set
      const response = await fetch(namesUrl, {
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
        // Transform the names into attendance records with default 'not present' state
        const records = data.names.map((name: string) => ({
          name,
          present: false,
        }));
        setAttendanceRecords(records);
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

  // Function to handle checkbox changes for attendance
  const handleAttendanceChange = (index: number, checked: boolean) => {
    const updatedRecords = [...attendanceRecords];
    updatedRecords[index].present = checked;
    setAttendanceRecords(updatedRecords);
  };

  // Function to save attendance to the backend
  const saveAttendanceData = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      console.log("Saving attendance data to:", saveUrl);

      const formattedDate = format(selectedDate, "yyyy-MM-dd");

      // Prepare data to be sent to the server
      const saveData = {
        date: formattedDate,
        attendance: attendanceRecords,
      };

      // Send the data to our saveAttendance endpoint
      const response = await fetch(saveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify(saveData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Save response:", responseData);

      setSaveSuccess(true);
    } catch (err) {
      console.error("Error saving attendance data:", err);
      setSaveError(
        `Failed to save attendance: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAttendanceNames();
  }, []);

  return (
    <Container className="mt-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">Church Attendance App</h1>
        </Col>
      </Row>

      {/* Date Selection */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group controlId="attendanceDate">
            <Form.Label>Attendance Date</Form.Label>
            <Form.Control
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
            />
          </Form.Group>
        </Col>
        <Col md={6} className="d-flex align-items-end">
          <Button
            variant="primary"
            onClick={fetchAttendanceNames}
            disabled={loading}
            className="me-2"
          >
            Refresh Names
          </Button>
          <Button
            variant="success"
            onClick={saveAttendanceData}
            disabled={loading || saving}
          >
            Save Attendance
          </Button>
        </Col>
      </Row>

      {/* Success/Error Messages for Saving */}
      {saveSuccess && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success">
              <Alert.Heading>Success!</Alert.Heading>
              <p>Attendance data saved successfully.</p>
            </Alert>
          </Col>
        </Row>
      )}

      {saveError && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <Alert.Heading>Error Saving Data</Alert.Heading>
              <p>{saveError}</p>
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading attendance names...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
              <Button
                variant="primary"
                onClick={fetchAttendanceNames}
                className="mt-2"
              >
                Try Again
              </Button>
            </Alert>
          ) : (
            <>
              <h3>Mark Attendance</h3>
              {attendanceRecords.length === 0 ? (
                <p>No names available.</p>
              ) : (
                <ListGroup>
                  {attendanceRecords.map((record, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex align-items-center"
                    >
                      <Form.Check
                        type="checkbox"
                        id={`attendance-${index}`}
                        checked={record.present}
                        onChange={(e) =>
                          handleAttendanceChange(index, e.target.checked)
                        }
                        label={record.name}
                        className="me-2"
                      />
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              {saving && (
                <div className="mt-3 text-center">
                  <Spinner animation="border" role="status" size="sm" />
                  <span className="ms-2">Saving attendance data...</span>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default App;
