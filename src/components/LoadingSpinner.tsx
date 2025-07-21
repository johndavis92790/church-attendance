import { Spinner } from "react-bootstrap";

interface LoadingSpinnerProps {
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = "Loading...",
}) => {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" role="status">
        <span className="visually-hidden">{message}</span>
      </Spinner>
    </div>
  );
};

export default LoadingSpinner;
