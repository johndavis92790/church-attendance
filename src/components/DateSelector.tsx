import { forwardRef } from "react";
import { Row, Col, Form } from "react-bootstrap";
import { format, parse } from "date-fns";

interface DateSelectorProps {
  selectedDate: string;
  availableDates: string[];
  loading: boolean;
  isSticky: boolean;
  onDateChange: (date: string) => void;
}

const DateSelector = forwardRef<HTMLDivElement, DateSelectorProps>(
  ({ selectedDate, availableDates, loading, isSticky, onDateChange }, ref) => {
    // Format a date from MM/DD/YYYY to a more readable format
    const formatDateForDisplay = (dateString: string): string => {
      try {
        const date = parse(dateString, "MM/dd/yyyy", new Date());
        return format(date, "MMMM d, yyyy");
      } catch (error) {
        return dateString; // If parsing fails, return the original string
      }
    };

    return (
      <div className={`sticky-header ${isSticky ? "sticky" : ""}`} ref={ref}>
        <Row className="mb-0">
          <Col md={6}>
            <Form.Group controlId="dateSelect">
              <Form.Label style={{ fontSize: "1.2rem", fontWeight: 500 }}>
                Select Sunday
              </Form.Label>
              <Form.Select
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
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
    );
  },
);

DateSelector.displayName = "DateSelector";

export default DateSelector;
