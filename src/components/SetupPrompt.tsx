import React from 'react';
import './SetupPrompt.css';

interface SetupPromptProps {
  icon: string;
  title: string;
  message: string;
  onSetup: () => void;
}

const SetupPrompt: React.FC<SetupPromptProps> = ({ icon, title, message, onSetup }) => {
  return (
    <div className="setup-prompt">
      <div className="setup-prompt-icon">{icon}</div>
      <h3 className="setup-prompt-title">{title}</h3>
      <p className="setup-prompt-message">{message}</p>
      <button className="setup-prompt-button" onClick={onSetup}>
        <span className="setup-button-icon">⚙️</span>
        Configure Now
      </button>
    </div>
  );
};

export default SetupPrompt;

