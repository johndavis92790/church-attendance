import React, { useState } from "react";
import { Modal, Button, Form, Alert } from "react-bootstrap";

interface AddMemberModalProps {
  show: boolean;
  onHide: () => void;
  onAddMember: (firstName: string, lastName: string) => boolean;
}

const AddMemberModal: React.FC<AddMemberModalProps> = ({
  show,
  onHide,
  onAddMember,
}) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!firstName.trim() || !lastName.trim()) {
      setError("Both first name and last name are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // Try to add the member
    const success = onAddMember(firstName.trim(), lastName.trim());
    
    if (success) {
      // Reset form and close modal
      setFirstName("");
      setLastName("");
      setError(null);
      onHide();
    } else {
      setError("A member with this name already exists.");
    }
    
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFirstName("");
    setLastName("");
    setError(null);
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Member</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form.Group className="mb-3">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter first name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
              autoFocus
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Member"}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddMemberModal;
