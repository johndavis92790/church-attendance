import { ListGroup, Form } from "react-bootstrap";

interface AttendanceRecord {
  name: string;
  present: boolean;
}

interface AttendanceListProps {
  attendanceRecords: AttendanceRecord[];
  onAttendanceChange: (index: number, checked: boolean) => void;
}

const AttendanceList: React.FC<AttendanceListProps> = ({
  attendanceRecords,
  onAttendanceChange,
}) => {
  return (
    <ListGroup>
      {attendanceRecords.map((record, index) => (
        <ListGroup.Item
          key={index}
          className="d-flex align-items-center justify-content-between py-3"
          style={{ cursor: "pointer" }}
          onClick={() => onAttendanceChange(index, !record.present)}
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
              onAttendanceChange(index, !record.present); // Handle toggle directly
            }}
            onClick={(e) => e.stopPropagation()} // Stop propagation
            style={{ transform: "scale(1.5)" }}
            className="ms-2"
            label=""
          />
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
};

export default AttendanceList;
