import { Alert } from "react-bootstrap";

interface ErrorAlertProps {
  message: string;
  variant?: "danger" | "warning" | "info";
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  variant = "danger",
}) => {
  return <Alert variant={variant}>{message}</Alert>;
};

export default ErrorAlert;
