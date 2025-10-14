import React, { useState } from 'react';
import './SetupModal.css';

interface SetupModalProps {
  title: string;
  icon: string;
  fields: {
    name: string;
    label: string;
    type: string;
    placeholder: string;
    required: boolean;
  }[];
  onSubmit: (data: { [key: string]: string }) => Promise<void>;
  onClose: () => void;
}

const SetupModal: React.FC<SetupModalProps> = ({ title, icon, fields, onSubmit, onClose }) => {
  const [formData, setFormData] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="setup-modal-header">
          <span className="setup-modal-icon">{icon}</span>
          <h3>{title} Setup</h3>
          <button className="setup-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="setup-modal-body">
          {fields.map((field) => (
            <div key={field.name} className="setup-field">
              <label htmlFor={field.name}>{field.label}</label>
              <input
                id={field.name}
                type={field.type}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.name] || ''}
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            </div>
          ))}

          {error && (
            <div className="setup-error">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="setup-modal-footer">
            <button type="button" className="setup-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="setup-btn-save" disabled={loading}>
              {loading ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupModal;

