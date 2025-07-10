import { useState, useEffect, useRef } from "react";
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
import { format, parse } from "date-fns";
import "./sticky-header.css"; // We'll create this file for custom styles

// Define interfaces for our data types
interface AttendanceRecord {
  name: string;
  present: boolean;
}

interface AttendanceData {
  name: string;
  attendance: {
    [date: string]: boolean;
  };
}

function App() {
  // State for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [fullAttendanceData, setFullAttendanceData] = useState<
    AttendanceData[]
  >([]);
  // State for sticky header
  const [isSticky, setIsSticky] = useState<boolean>(false);
  // Ref for header element
  const headerRef = useRef<HTMLDivElement>(null);

  // URLs for our Cloud Functions - simplified to only the two we need
  const [dataUrl] = useState<string>(
    "https://getattendancedata-yfwa26h2fa-uc.a.run.app",
  );
  const [updateUrl] = useState<string>(
    "https://updateattendance-yfwa26h2fa-uc.a.run.app",
  );
  // State to track if authentication is required
  const [authRequired, setAuthRequired] = useState<boolean>(false);

  // Function to fetch attendance data from the Cloud Function
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSaveSuccess(false);
      setSaveError(null);

      console.log("Fetching attendance data from:", dataUrl);

      // Use the fetch API with mode: 'cors' explicitly set
      const response = await fetch(dataUrl, {
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
      console.log("Attendance data received:", data);

      if (
        data &&
        Array.isArray(data.dates) &&
        Array.isArray(data.attendanceData)
      ) {
        // Store the full attendance data
        setFullAttendanceData(data.attendanceData);

        // Set available dates
        setAvailableDates(data.dates);

        // Set the initially selected date if available
        if (data.dates.length > 0) {
          const initialDate = data.dates[0];
          setSelectedDate(initialDate);
          updateAttendanceRecordsForDate(initialDate, data.attendanceData);
        }
      } else {
        console.error("Invalid data format received:", data);
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error("Error fetching attendance data:", err);
      setError(
        `Failed to load attendance data: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update attendance records for a specific date
  const updateAttendanceRecordsForDate = (
    date: string,
    data: AttendanceData[],
  ) => {
    const records = data.map((item) => ({
      name: item.name,
      present: item.attendance[date] || false,
    }));

    setAttendanceRecords(records);
  };

  // Function to handle checkbox changes for attendance
  const handleAttendanceChange = (index: number, checked: boolean) => {
    const updatedRecords = [...attendanceRecords];
    updatedRecords[index].present = checked;
    setAttendanceRecords(updatedRecords);

    // Also update the full attendance data
    if (selectedDate && fullAttendanceData[index]) {
      const updatedFullData = [...fullAttendanceData];
      updatedFullData[index].attendance[selectedDate] = checked;
      setFullAttendanceData(updatedFullData);
    }
  };

  // Function to handle date selection change
  // Format a date from MM/DD/YYYY to a more readable format
  const formatDateForDisplay = (dateString: string): string => {
    try {
      // Parse the date from format like "7/20/2025"
      const date = parse(dateString, "M/d/yyyy", new Date());
      // Format to a nicer display like "July 20, 2025"
      return format(date, "MMMM d, yyyy");
    } catch (error) {
      // If parsing fails, just return the original string
      return dateString;
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    updateAttendanceRecordsForDate(date, fullAttendanceData);
  };

  // Function to save attendance to the backend
  const saveAttendanceData = async () => {
    try {
      setSaving(true);
      setSaveSuccess(false);
      setSaveError(null);

      console.log("Updating attendance data to:", updateUrl);

      // Prepare data to be sent to the server
      const updateData = {
        date: selectedDate,
        attendance: attendanceRecords,
      };

      // Send the data to our updateAttendance endpoint
      const response = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        mode: "cors",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Update response:", responseData);

      setSaveSuccess(true);
    } catch (err) {
      console.error("Error updating attendance data:", err);
      setSaveError(
        `Failed to update attendance: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add scroll event listener for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (headerRef.current) {
        const headerOffset = headerRef.current.offsetTop;
        setIsSticky(window.pageYOffset > headerOffset);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Container className="mt-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">Sunday School Attendance</h1>
        </Col>
      </Row>

      {/* Date Selection - Sticky Header */}
      <div
        className={`sticky-header ${isSticky ? "sticky" : ""}`}
        ref={headerRef}
      >
        <Row className="mb-0">
          <Col md={6}>
            <Form.Group controlId="dateSelect">
              <Form.Label style={{ fontSize: "1.2rem", fontWeight: 500 }}>
                Select Sunday
              </Form.Label>
              <Form.Select
                value={selectedDate}
                onChange={(e) => handleDateChange(e.target.value)}
                disabled={loading || availableDates.length === 0}
                style={{ fontSize: "1.2rem" }}
              >
                {availableDates.length === 0 ? (
                  <option value="">No dates available</option>
                ) : (
                  availableDates.map((date) => (
                    <option key={date} value={date}>
                      {formatDateForDisplay(date)}
                    </option>
                  ))
                )}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
      </div>

      {/* Add some spacing after the sticky header */}
      <div className="main-content"></div>

      <Row>
        <Col>
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-2">Loading attendance data...</p>
            </div>
          ) : error ? (
            <Alert variant="danger">
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
              <Button
                variant="primary"
                onClick={fetchAttendanceData}
                className="mt-2"
              >
                Try Again
              </Button>
            </Alert>
          ) : (
            <>
              {attendanceRecords.length === 0 ? (
                <p>No names available.</p>
              ) : (
                <ListGroup>
                  {attendanceRecords.map((record, index) => (
                    <ListGroup.Item
                      key={index}
                      className="d-flex align-items-center justify-content-between py-3"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        handleAttendanceChange(index, !record.present)
                      }
                    >
                      <span style={{ fontSize: "1.2rem", fontWeight: 500 }}>
                        {record.name}
                      </span>
                      <Form.Check
                        type="checkbox"
                        id={`attendance-${index}`}
                        checked={record.present}
                        onChange={(e) => {
                          e.stopPropagation(); // Stop event from bubbling up
                          handleAttendanceChange(index, !record.present); // Handle toggle directly
                        }}
                        onClick={(e) => e.stopPropagation()} // Stop propagation
                        style={{ transform: "scale(1.5)" }}
                        className="ms-2"
                        label=""
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

              {authRequired && (
                <Alert variant="warning" className="mt-3">
                  <Alert.Heading>Authentication Required</Alert.Heading>
                  <p>
                    This function requires authentication. Please check your
                    Firebase function permissions.
                  </p>
                </Alert>
              )}
            </>
          )}
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

      {/* Date Selection */}
      <Row className="mb-3 mt-3 ">
        <Col md={12} className="d-flex align-items-end justify-content-center">
          <Button
            variant="primary"
            onClick={fetchAttendanceData}
            disabled={loading}
            className="me-2"
          >
            Refresh Data
          </Button>
          <Button
            variant="success"
            onClick={saveAttendanceData}
            disabled={loading || saving || !selectedDate}
          >
            Save Attendance
          </Button>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
