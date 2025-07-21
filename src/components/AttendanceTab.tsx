import { Row, Col, Alert } from "react-bootstrap";
import LoadingSpinner from "./LoadingSpinner";
import ErrorAlert from "./ErrorAlert";
import AttendanceList from "./AttendanceList";
import SaveControls from "./SaveControls";

interface AttendanceRecord {
  name: string;
  present: boolean;
}

interface AttendanceTabProps {
  loading: boolean;
  error: string | null;
  attendanceRecords: AttendanceRecord[];
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onAttendanceChange: (index: number, checked: boolean) => void;
  onSave: () => void;
}

const AttendanceTab: React.FC<AttendanceTabProps> = ({
  loading,
  error,
  attendanceRecords,
  saving,
  saveSuccess,
  saveError,
  onAttendanceChange,
  onSave,
}) => {
  return (
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
  );
};

export default AttendanceTab;
