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
import {
  GoogleAuthProvider,
  signInWithPopup,
  User,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase-config";
import { isUserAuthorized } from "./auth-config";

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

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setAuthLoading(true);
      setUser(currentUser);

      if (currentUser) {
        // Check if user's email is in the whitelist
        const authorized = isUserAuthorized(currentUser.email);
        setIsAuthorized(authorized);

        if (authorized) {
          // If authorized, fetch attendance data
          await fetchAttendanceData();
        } else {
          setAuthError("You are not authorized to access this application.");
          // Sign out unauthorized users
          await signOut(auth);
        }
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Google sign-in
  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError(null);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle sign-out
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Clear data on sign out
      setAttendanceRecords([]);
      setFullAttendanceData([]);
      setAvailableDates([]);
      setSelectedDate("");
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

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
      <Row className="mb-4 d-flex align-items-center justify-content-between">
        <Col>
          <h1>Sunday School Attendance</h1>
        </Col>
        <Col xs="auto">
          {user ? (
            <Button
              variant="outline-secondary"
              onClick={handleSignOut}
              className="d-flex align-items-center"
            >
              <span className="me-2">{user.displayName || user.email}</span>
              Sign Out
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSignIn}
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
        </Col>
      </Row>

      {authError && (
        <Alert variant="danger" className="mb-4">
          {authError}
        </Alert>
      )}

      {/* Show content only to authorized users */}
      {!user ? (
        <div className="text-center py-5">
          <Alert variant="info">
            Please sign in with your Google account to access the attendance
            system.
          </Alert>
        </div>
      ) : !isAuthorized ? (
        <div className="text-center py-5">
          <Alert variant="warning">
            Your account ({user.email}) is not authorized to access this
            application. Please contact the administrator to request access.
          </Alert>
        </div>
      ) : (
        <>
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

          {/* Attendance content */}
          <Row>
            <Col>
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </Spinner>
                </div>
              ) : error ? (
                <Alert variant="danger">{error}</Alert>
              ) : attendanceRecords.length > 0 ? (
                <div>
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

                  <div className="mt-4 d-flex gap-3">
                    <Button
                      variant="primary"
                      onClick={saveAttendanceData}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                          />
                          <span className="ms-2">Saving...</span>
                        </>
                      ) : (
                        "Save Changes"
                      )}
                    </Button>

                    {saveSuccess && (
                      <Alert
                        variant="success"
                        className="mb-0 py-2 px-3 d-inline-block"
                      >
                        Saved successfully!
                      </Alert>
                    )}

                    {saveError && <Alert variant="danger">{saveError}</Alert>}
                  </div>
                </div>
              ) : (
                <Alert variant="info">No attendance data available.</Alert>
              )}
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
}

export default App;
