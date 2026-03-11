import { useState, useEffect } from 'react';
import { FormSection, FieldInput } from '../components/FormFields';

export default function ConfigPage({ config, onSaveConfig, entries, onArchive, showToast, onAddTeamWithArchive }) {
  const [compName, setCompName]       = useState(config.competitionName || '');
  const [teams, setTeams]             = useState(config.teams || []);
  const [teamInput, setTeamInput]     = useState('');
  const [confirmArchive, setConfirm]  = useState(false);
  const [hasChanges, setHasChanges]   = useState(false);

  // Update local state when config prop changes (from Firebase)
  // Only do this if we don't have unsaved changes
  useEffect(() => {
    if (!hasChanges) {
      setCompName(config.competitionName || '');
      setTeams(config.teams || []);
    }
  }, [config.competitionName, config.teams, hasChanges]);

  // Track changes
  useEffect(() => {
    const configChanged = JSON.stringify({ competitionName: compName, teams }) !== 
      JSON.stringify({ competitionName: config.competitionName, teams: config.teams });
    setHasChanges(configChanged);
  }, [compName, teams, config.competitionName, config.teams]);

  const handleSave = () => {
    onSaveConfig({ competitionName: compName, teams });
    setHasChanges(false);
    if (showToast) {
      showToast('Configuration saved!', 'success');
    }
  };

  const addTeam = () => {
    const raw   = teamInput.trim();
    if (!raw) return;
    // Accept "4776 Brophy Broncos", "4776, Brophy Broncos", "4776–Brophy Broncos" etc.
    const match = raw.match(/^(\d+)\s*[,\-–\s]\s*(.+)$/);
    const num   = match ? match[1] : raw;
    const name  = match ? match[2].trim() : `Team ${raw}`;
    if (teams.find((t) => t.number === num)) { setTeamInput(''); return; }
    setTeams((prev) => [...prev, { number: num, name }]);
    setTeamInput('');
    
    // Check if this team has archived data
    if (onAddTeamWithArchive) {
      onAddTeamWithArchive(num, name);
    }
  };

  const removeTeam = (num) => setTeams((prev) => prev.filter((t) => t.number !== num));

  const handleArchive = () => {
    onArchive(compName || 'Unnamed Competition');
    setConfirm(false);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Configuration</h1>
        <p>Manage competition details, teams, and data archiving</p>
      </div>

      {/* Save button */}
      <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          className={hasChanges ? "archive-btn" : "cancel-btn"} 
          onClick={handleSave}
          disabled={!hasChanges}
        >
          {hasChanges ? 'Save Changes' : 'Saved'}
        </button>
      </div>

      {/* Competition name */}
      <FormSection title="Competition">
        <FieldInput
          label="Active Competition Name"
          value={compName}
          onChange={setCompName}
          placeholder="e.g. Arizona Regional 2025"
        />
      </FormSection>

      {/* Teams */}
      <FormSection title="Teams">
        <p className="help-text">
          Enter the team number followed by the team name, e.g.{' '}
          <code>4776 Brophy Broncos</code>. Press Enter or click + Add.
        </p>
        <div className="team-add-row">
          <input
            value={teamInput}
            onChange={(e) => setTeamInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTeam()}
            placeholder="e.g. 254 The Cheesy Poofs"
          />
          <button className="add-team-btn" onClick={addTeam}>+ Add</button>
        </div>

        <div className="team-list">
          {teams.length === 0 && (
            <div className="empty-state" style={{ padding: '16px 0' }}>No teams added yet</div>
          )}
          {teams.map((t) => (
            <div key={t.number} className="team-list-row">
              <span className="team-list-num">{t.number}</span>
              <span>{t.name}</span>
              <button className="remove-btn" onClick={() => removeTeam(t.number)} title="Remove">✕</button>
            </div>
          ))}
        </div>
      </FormSection>

      {/* Archive */}
      <FormSection title="Archive Competition">
        {(() => {
          const configuredTeams = config.teams ? config.teams.length : 0;
          return (
            <p className="help-text">
              Move all active scouting entries ({configuredTeams} team{configuredTeams !== 1 ? 's' : ''}) to
              History under <strong>"{compName || 'Unnamed Competition'}"</strong>. This will clear the active
              scouting data.
            </p>
          );
        })()}
        {!confirmArchive ? (
          <button
            className="archive-btn"
            onClick={() => setConfirm(true)}
            disabled={entries.length === 0}
          >
            Archive & Move to History
          </button>
        ) : (
          <div className="confirm-row">
            <span>Are you sure? This cannot be undone.</span>
            <button className="archive-btn" onClick={handleArchive}>Yes, Archive</button>
            <button className="cancel-btn" onClick={() => setConfirm(false)}>Cancel</button>
          </div>
        )}
      </FormSection>
    </div>
  );
}

