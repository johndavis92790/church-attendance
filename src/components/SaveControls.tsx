import { Button, Spinner, Alert } from "react-bootstrap";

interface SaveControlsProps {
  saving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  onSave: () => void;
}

const SaveControls: React.FC<SaveControlsProps> = ({
  saving,
  saveSuccess,
  saveError,
  onSave,
}) => {
  return (
    <div className="m-4 d-flex gap-3">
      <Button variant="primary" onClick={onSave} disabled={saving}>
        {saving ? (
          <>
            <Spinner
              as="span"
              animation="border"
              size="sm"
              role="status"
              aria-hidden="true"
            />
            <span className="ms-2">Saving...</span>
          </>
        ) : (
          "Save Changes"
        )}
      </Button>

      {saveSuccess && (
        <Alert variant="success" className="mb-0 py-2 px-3 d-inline-block">
          Saved successfully!
        </Alert>
      )}

      {saveError && <Alert variant="danger">{saveError}</Alert>}
    </div>
  );
};

export default SaveControls;
