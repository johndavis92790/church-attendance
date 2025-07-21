import { forwardRef, useState } from "react";
import { Row, Col, Alert } from "react-bootstrap";
import DateSelector from "../components/DateSelector";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorAlert from "../components/ErrorAlert";
import AttendanceList from "../components/AttendanceList";
import SaveControls from "../components/SaveControls";
import FloatingAddButton from "../components/FloatingAddButton";
import AddMemberModal from "../components/AddMemberModal";
import { AttendanceRecord } from "../App";

interface AttendancePageProps {
  selectedDate: string;
  availableDates: string[];
  loading: boolean;
  error: string | null;
  attendanceRecords: AttendanceRecord[];
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  isSticky: boolean;
  onDateChange: (date: string) => void;
  onAttendanceChange: (index: number, checked: boolean) => void;
  onSave: () => void;
  onAddNewMember: (firstName: string, lastName: string) => boolean;
}

const AttendancePage = forwardRef<HTMLDivElement, AttendancePageProps>(
  (
    {
      selectedDate,
      availableDates,
      loading,
      error,
      attendanceRecords,
      saving,
      saveSuccess,
      saveError,
      isSticky,
      onDateChange,
      onAttendanceChange,
      onSave,
      onAddNewMember,
    },
    ref,
  ) => {
    const [showAddModal, setShowAddModal] = useState(false);

    const handleShowAddModal = () => setShowAddModal(true);
    const handleCloseAddModal = () => setShowAddModal(false);
    return (
      <>
        {/* Date Selection - Sticky Header */}
        <DateSelector
          selectedDate={selectedDate}
          availableDates={availableDates}
          loading={loading}
          isSticky={isSticky}
          onDateChange={onDateChange}
          ref={ref}
        />

        {/* Add some spacing after the sticky header */}
        <div className="main-content mb-3"></div>

        {/* Attendance content */}
        <Row>
          <Col>
            {loading ? (
              <LoadingSpinner />
            ) : error ? (
              <ErrorAlert message={error} />
            ) : attendanceRecords.length > 0 ? (
              <div>
                <AttendanceList
                  attendanceRecords={attendanceRecords}
                  onAttendanceChange={onAttendanceChange}
                />
                <SaveControls
                  saving={saving}
                  saveSuccess={saveSuccess}
                  saveError={saveError}
                  onSave={onSave}
                />
              </div>
            ) : (
              <Alert variant="info">No attendance data available.</Alert>
            )}
          </Col>
        </Row>
        
        {/* Floating Add Button */}
        <FloatingAddButton onClick={handleShowAddModal} />
        
        {/* Add Member Modal */}
        <AddMemberModal
          show={showAddModal}
          onHide={handleCloseAddModal}
          onAddMember={onAddNewMember}
        />
      </>
    );
  },
);

AttendancePage.displayName = "AttendancePage";

export default AttendancePage;
