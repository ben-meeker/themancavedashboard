import React from 'react';
import './EditModeToggle.css';

interface EditModeToggleProps {
  isEditMode: boolean;
  onToggle: () => void;
}

const EditModeToggle: React.FC<EditModeToggleProps> = ({ isEditMode, onToggle }) => {
  return (
    <button 
      className={`edit-mode-toggle ${isEditMode ? 'active' : ''}`}
      onClick={onToggle}
      title={isEditMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
    >
      {isEditMode ? (
        <>
          <span className="toggle-icon">✓</span>
          <span className="toggle-text">Done</span>
        </>
      ) : (
        <span className="toggle-icon-only">✏️</span>
      )}
    </button>
  );
};

export default EditModeToggle;

