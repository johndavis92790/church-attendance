import React, { useState, useEffect } from "react";
import {
  Card,
  ListGroup,
  Form,
  Button,
  Spinner,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  getAuthorizedEmails,
  addAuthorizedEmail,
  removeAuthorizedEmail,
} from "../auth-config";

interface UserManagementProps {
  currentUserEmail: string;
}

const UserManagement: React.FC<UserManagementProps> = ({
  currentUserEmail,
}) => {
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [newEmail, setNewEmail] = useState<string>("");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<boolean>(false);
  const [removeSuccess, setRemoveSuccess] = useState<boolean>(false);

  // Load authorized emails
  const loadAuthorizedEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      const emails = await getAuthorizedEmails();
      setAuthorizedEmails(emails);
    } catch (error) {
      console.error("Error loading authorized emails:", error);
      setError("Failed to load authorized emails. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Load emails on component mount
  useEffect(() => {
    loadAuthorizedEmails();
  }, []);

  // Add new email
  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newEmail.trim()) {
      return;
    }

    try {
      setIsAdding(true);
      setError(null);
      setAddSuccess(false);

      const success = await addAuthorizedEmail(newEmail, currentUserEmail);

      if (success) {
        setNewEmail("");
        setAddSuccess(true);
        loadAuthorizedEmails();
      } else {
        setError(`Failed to add ${newEmail}. It may already be authorized.`);
      }
    } catch (error) {
      console.error("Error adding email:", error);
      setError(`Failed to add ${newEmail}. Please try again.`);
    } finally {
      setIsAdding(false);
    }
  };

  // Remove email
  const handleRemoveEmail = async (email: string) => {
    if (email === currentUserEmail) {
      setError("You cannot remove your own email from the authorized list.");
      return;
    }

    try {
      setIsRemoving(email);
      setError(null);
      setRemoveSuccess(false);

      const success = await removeAuthorizedEmail(email);

      if (success) {
        setRemoveSuccess(true);
        loadAuthorizedEmails();
      } else {
        setError(`Failed to remove ${email}. Please try again.`);
      }
    } catch (error) {
      console.error("Error removing email:", error);
      setError(`Failed to remove ${email}. Please try again.`);
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <Card className="mt-4 mb-5">
      <Card.Header as="h5">Manage Authorized Users</Card.Header>
      <Card.Body>
        {/* Add user form */}
        <Form onSubmit={handleAddEmail} className="mb-4">
          <Form.Group className="mb-3">
            <Form.Label>Add New User</Form.Label>
            <div className="d-flex">
              <Form.Control
                type="email"
                placeholder="Enter email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={isAdding}
                required
              />
              <Button
                type="submit"
                variant="primary"
                className="ms-2"
                disabled={isAdding || !newEmail.trim()}
              >
                {isAdding ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Adding...
                  </>
                ) : (
                  "Add User"
                )}
              </Button>
            </div>
            <Form.Text className="text-muted">
              Only add users who should have access to the attendance system.
            </Form.Text>
          </Form.Group>
        </Form>

        {/* Success/Error messages */}
        {addSuccess && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setAddSuccess(false)}
          >
            User added successfully!
          </Alert>
        )}

        {removeSuccess && (
          <Alert
            variant="success"
            dismissible
            onClose={() => setRemoveSuccess(false)}
          >
            User removed successfully!
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* User list */}
        <h5 className="mb-3">Authorized Users</h5>
        {loading ? (
          <div className="text-center py-3">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : authorizedEmails.length === 0 ? (
          <Alert variant="info">No authorized users found.</Alert>
        ) : (
          <ListGroup>
            {authorizedEmails.map((email) => (
              <ListGroup.Item
                key={email}
                className="d-flex justify-content-between align-items-center"
              >
                {email}
                {email === currentUserEmail ? (
                  <Badge bg="success">You</Badge>
                ) : (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveEmail(email)}
                    disabled={isRemoving === email}
                  >
                    {isRemoving === email ? (
                      <Spinner
                        as="span"
                        animation="border"
                        size="sm"
                        role="status"
                        aria-hidden="true"
                      />
                    ) : (
                      "Remove"
                    )}
                  </Button>
                )}
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
    </Card>
  );
};

export default UserManagement;
