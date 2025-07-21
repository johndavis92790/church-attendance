import React from "react";
import { Button } from "react-bootstrap";

interface FloatingAddButtonProps {
  onClick: () => void;
}

const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <Button
      variant="primary"
      onClick={onClick}
      className="rounded-circle shadow-lg"
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        width: "60px",
        height: "60px",
        fontSize: "24px",
        zIndex: 1000,
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      title="Add New Member"
    >
      +
    </Button>
  );
};

export default FloatingAddButton;
