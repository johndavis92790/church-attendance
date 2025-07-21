import { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Tab } from "react-bootstrap";
import "./sticky-header.css"; // We'll create this file for custom styles
import {
  GoogleAuthProvider,
  signInWithPopup,
  User,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase-config";
import { isUserAuthorized } from "./auth-config";
import UserManagement from "./components/UserManagement";
import AuthenticationHeader from "./components/AuthenticationHeader";
import DateSelector from "./components/DateSelector";
import TabNavigation from "./components/TabNavigation";
import AttendanceTab from "./components/AttendanceTab";
import ErrorAlert from "./components/ErrorAlert";

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

  // State for all attendance data
  const [fullAttendanceData, setFullAttendanceData] = useState<
    AttendanceData[]
  >([]);

  // Available dates for the dropdown
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Selected date for viewing attendance
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Loading state for data fetching
  const [loading, setLoading] = useState<boolean>(true);

  // Error state for data fetching
  const [error, setError] = useState<string | null>(null);

  // Saving state for attendance updates
  const [saving, setSaving] = useState<boolean>(false);

  // Success state for attendance updates
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Error state for attendance updates
  const [saveError, setSaveError] = useState<string | null>(null);

  // State for user authentication
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);

  // State for sticky header
  const [isSticky, setIsSticky] = useState<boolean>(false);

  // Ref for header element
  const headerRef = useRef<HTMLDivElement>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState<string>("attendance");

  // URLs for our Cloud Functions
  const [dataUrl] = useState<string>(
    "https://getattendancedata-yfwa26h2fa-uc.a.run.app",
  );

  const [updateUrl] = useState<string>(
    "https://updateattendance-yfwa26h2fa-uc.a.run.app",
  );

  // Handle Google Sign-in
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Error signing in:", error);
      setAuthError(`Error signing in: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle sign-out
  const handleSignOut = async () => {
    try {
      setAuthError(null);
      setAuthLoading(true);
      await signOut(auth);
      setUser(null);
      setIsAuthorized(false);
    } catch (error: any) {
      console.error("Error signing out:", error);
      setAuthError(`Error signing out: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Function to fetch attendance data from the Cloud Function
  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Fetched attendance data:", data);

      // Store the full attendance data
      setFullAttendanceData(data.attendance);

      // Get available dates
      setAvailableDates(data.dates);

      // Set the most recent date as the default selection
      const initialDate = data.dates.length > 0 ? data.dates[0] : "";
      setSelectedDate(initialDate);

      // Update the attendance records for the selected date
      if (initialDate) {
        updateAttendanceRecordsForDate(initialDate, data.attendance);
      }

      setLoading(false);
    } catch (error: any) {
      console.error("Error fetching attendance data:", error);
      setError(`Error fetching attendance data: ${error.message}`);
      setLoading(false);
    }
  };

  // Helper function to update attendance records for a specific date
  const updateAttendanceRecordsForDate = (
    date: string,
    data: AttendanceData[],
  ) => {
    const records = data.map((person) => ({
      name: person.name,
      present: person.attendance[date] || false,
    }));
    setAttendanceRecords(records);
  };

  // Function to handle checkbox changes for attendance
  const handleAttendanceChange = (index: number, checked: boolean) => {
    const updatedRecords = [...attendanceRecords];
    updatedRecords[index].present = checked;
    setAttendanceRecords(updatedRecords);

    // Reset success/error messages when changes are made
    setSaveSuccess(false);
    setSaveError(null);
  };

  // Function to handle date selection change
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

      // Update the fullAttendanceData with the current attendance records
      const updatedFullData = [...fullAttendanceData];
      attendanceRecords.forEach((record) => {
        const personIndex = updatedFullData.findIndex(
          (p) => p.name === record.name,
        );
        if (personIndex >= 0) {
          updatedFullData[personIndex].attendance[selectedDate] =
            record.present;
        }
      });

      // Create the payload to send to the backend
      const payload = {
        date: selectedDate,
        attendance: attendanceRecords.map((record) => ({
          name: record.name,
          present: record.present,
        })),
      };

      // Send the update to the backend
      const response = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Update local state with the changes
      setFullAttendanceData(updatedFullData);
      setSaveSuccess(true);
    } catch (error: any) {
      console.error("Error saving attendance data:", error);
      setSaveError(`Error saving attendance data: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle authentication state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setAuthLoading(true);
      setUser(currentUser);

      if (currentUser) {
        try {
          // Check if user's email is in the whitelist
          const authorized = await isUserAuthorized(currentUser.email);
          setIsAuthorized(authorized);

          if (authorized) {
            // If authorized, fetch attendance data
            await fetchAttendanceData();
          } else {
            setAuthError("You are not authorized to access this application.");
            // Sign out unauthorized users
            await signOut(auth);
          }
        } catch (error) {
          console.error("Error checking authorization:", error);
          setAuthError("Error checking authorization. Please try again later.");
        }
      }

      setAuthLoading(false);
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle scroll events for sticky header
  const handleScroll = () => {
    if (headerRef.current) {
      const headerTop = headerRef.current.getBoundingClientRect().top;
      setIsSticky(headerTop <= 0);
    }
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    // Clean up
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Container className="mt-5">
      <AuthenticationHeader
        user={user}
        authLoading={authLoading}
        onSignIn={handleSignIn}
        onSignOut={handleSignOut}
      />

      {authError && <ErrorAlert message={authError} />}

      {!user ? (
        <div className="text-center py-5">
          <ErrorAlert
            message="Please sign in with your Google account to access the attendance system."
            variant="info"
          />
        </div>
      ) : !isAuthorized ? (
        <div className="text-center py-5">
          <ErrorAlert
            message={`Your account (${user.email}) is not authorized to access this application. Please contact the administrator to request access.`}
            variant="warning"
          />
        </div>
      ) : (
        <>
          {/* Date Selection - Sticky Header (only for attendance tab) */}
          {activeTab === "attendance" && (
            <DateSelector
              selectedDate={selectedDate}
              availableDates={availableDates}
              loading={loading}
              isSticky={isSticky}
              onDateChange={handleDateChange}
              ref={headerRef}
            />
          )}

          {/* Add some spacing after the sticky header */}
          <div className="main-content mb-3"></div>

          {/* Tab navigation */}
          <TabNavigation activeTab={activeTab} onTabSelect={setActiveTab} />

          {/* Tab content */}
          <Tab.Content>
            <Tab.Pane active={activeTab === "attendance"}>
              <AttendanceTab
                loading={loading}
                error={error}
                attendanceRecords={attendanceRecords}
                saving={saving}
                saveSuccess={saveSuccess}
                saveError={saveError}
                onAttendanceChange={handleAttendanceChange}
                onSave={saveAttendanceData}
              />
            </Tab.Pane>
            <Tab.Pane active={activeTab === "users"}>
              {/* User management content */}
              <UserManagement currentUserEmail={user?.email || ""} />
            </Tab.Pane>
          </Tab.Content>
        </>
      )}
    </Container>
  );
}

export default App;
