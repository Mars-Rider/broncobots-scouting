import { useState, useEffect, useRef } from 'react';
import {
  FormSection, FieldInput, FieldTextarea,
  Toggle, MultiToggle, MultiSelectToggle, VolumeInput,
} from '../components/FormFields';
import RouteCanvas from '../components/RouteCanvas';

const BLANK = {
  teamName: '', teamNumber: '',
  designDesc: '', fuelCapacity: '',
  startingAlliance: '', startingPosition: '',
  intakeMech: [],
  speed: '',
  speedCrossing: '',
  autoTracking: '', shootMoving: '',
  notes: '',
  autoRoutes: [],
  autoIntakeFuel: '', autoIntakeSec: '',
  autoOuttakeFuel: '', autoOuttakeSec: '',
  autoFuelScored: '',
  leavePoint: '', autoClimb: '',
  autoClimbSection: '', autoClimbLevel: '',
  crossPastHub: '', crossPath: [],
  teleopIntakeFuel: '', teleopIntakeSec: '',
  teleopOuttakeFuel: '', teleopOuttakeSec: '',
  teleopFuelScored: '',
  teleopClimb: '', teleopClimbSection: '', teleopClimbLevel: '',
  teleopCrossPastHub: '', teleopCrossPath: [],
};

export default function InputPage({ teams, onSubmit, showToast, user }) {
  const [form, setForm]             = useState(BLANK);
  const [submitted, setSubmitted]   = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [photoUrls, setPhotoUrls]   = useState([]);
  const inputRef = useRef(null);

  // Check for imported entry on mount
  useEffect(() => {
    const importedData = sessionStorage.getItem('importedEntry');
    if (importedData) {
      try {
        const entry = JSON.parse(importedData);
        setForm({
          teamName: entry.teamName || '',
          teamNumber: entry.teamNumber || '',
          designDesc: entry.designDesc || '',
          fuelCapacity: entry.fuelCapacity || '',
          startingAlliance: entry.startingAlliance || '',
          startingPosition: entry.startingPosition || '',
          intakeMech: entry.intakeMech || [],
          speed: entry.speed || '',
          speedCrossing: entry.speedCrossing || '',
          autoTracking: entry.autoTracking || '',
          shootMoving: entry.shootMoving || '',
          notes: entry.notes || '',
          autoRoutes: entry.autoRoutes || [],
          autoIntakeFuel: entry.autoIntakeFuel || '',
          autoIntakeSec: entry.autoIntakeSec || '',
          autoOuttakeFuel: entry.autoOuttakeFuel || '',
          autoOuttakeSec: entry.autoOuttakeSec || '',
          autoFuelScored: entry.autoFuelScored || '',
          leavePoint: entry.leavePoint || '',
          autoClimb: entry.autoClimb || '',
          autoClimbSection: entry.autoClimbSection || '',
          autoClimbLevel: entry.autoClimbLevel || '',
          crossPastHub: entry.crossPastHub || '',
          crossPath: entry.crossPath || [],
          teleopIntakeFuel: entry.teleopIntakeFuel || '',
          teleopIntakeSec: entry.teleopIntakeSec || '',
          teleopOuttakeFuel: entry.teleopOuttakeFuel || '',
          teleopOuttakeSec: entry.teleopOuttakeSec || '',
          teleopFuelScored: entry.teleopFuelScored || '',
          teleopClimb: entry.teleopClimb || '',
          teleopClimbSection: entry.teleopClimbSection || '',
          teleopClimbLevel: entry.teleopClimbLevel || '',
          teleopCrossPath: entry.teleopCrossPath || [],
          teleopCrossPastHub: entry.teleopCrossPastHub || '',
        });
        showToast('Imported data from previous competition. Please review and submit.', 'info');
        sessionStorage.removeItem('importedEntry');
      } catch (e) {
        console.error('Failed to parse imported entry:', e);
      }
    }
  }, []);

  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    // Validation for ALL required fields
    if (!form.teamName) { 
      showToast('Please select a team.', 'warning');
      return; 
    }
    if (!form.startingAlliance) {
      showToast('Please select a starting alliance.', 'warning');
      return;
    }
    if (!form.startingPosition) {
      showToast('Please select a starting position.', 'warning');
      return;
    }
    if (!form.intakeMech || form.intakeMech.length === 0) {
      showToast('Please select an intake mechanism.', 'warning');
      return;
    }
    if (!form.speed) {
      showToast('Please select speed option.', 'warning');
      return;
    }
    if (!form.speedCrossing) {
      showToast('Please select speed when crossing.', 'warning');
      return;
    }
    if (!form.autoTracking) {
      showToast('Please select auto tracking option.', 'warning');
      return;
    }
    if (!form.shootMoving) {
      showToast('Please select shoot while moving option.', 'warning');
      return;
    }
    if (!form.leavePoint) {
      showToast('Please select leave point option.', 'warning');
      return;
    }
    if (!form.autoRoutes || form.autoRoutes.length === 0) {
      showToast('Please draw at least one route on the field.', 'warning');
      return;
    }
    if (!form.autoClimb) {
      showToast('Please select climb option.', 'warning');
      return;
    }
    if (form.autoClimb === 'yes' && (!form.autoClimbSection || !form.autoClimbLevel)) {
      showToast('Please select climb section and level.', 'warning');
      return;
    }
    if (!form.crossPastHub) {
      showToast('Please select cross past hub option.', 'warning');
      return;
    }
    if (form.crossPastHub === 'yes' && (!form.crossPath || form.crossPath.length === 0)) {
      showToast('Please select cross path.', 'warning');
      return;
    }
    if (!form.teleopClimb) {
      showToast('Please select teleop climb option.', 'warning');
      return;
    }
    if (form.teleopClimb === 'yes' && (!form.teleopClimbSection || !form.teleopClimbLevel)) {
      showToast('Please select climb section and level.', 'warning');
      return;
    }
    if (!form.teleopCrossPastHub) {
      showToast('Please select teleop cross past hub option.', 'warning');
      return;
    }
    if (form.teleopCrossPastHub === 'yes' && (!form.teleopCrossPath || form.teleopCrossPath.length === 0)) {
      showToast('Please select teleop cross path.', 'warning');
      return;
    }

    setUploading(true);

    const userName = user?.name || user?.email || 'Unknown';
    onSubmit({ ...form, id: Date.now(), timestamp: new Date().toISOString(), userName: userName });
    setForm(BLANK);
    setSubmitted(true);
    setUploading(false);
    setTimeout(() => setSubmitted(false), 3500);
  };

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Scout Entry</h1>
        <p>Fill out all sections for each robot observation</p>
      </div>

      {submitted && <div className="success-toast"><span>Entry submitted successfully!</span></div>}
      {uploading && <div className="uploading-overlay"><span>Submitting...</span></div>}

      {/* ── General ─────────────────────────────────────────────────────────── */}
      <FormSection title="General Information">
        <div className="field">
          <label>Team <span className="req">*</span></label>
          <select
            value={form.teamName ? `${form.teamNumber}|${form.teamName}` : ''}
            onChange={(e) => {
              if (!e.target.value) return;
              const [num, ...nameParts] = e.target.value.split('|');
              setForm((f) => ({ ...f, teamNumber: num, teamName: nameParts.join('|') }));
            }}
          >
            <option value="">— Select Team —</option>
            {teams.map((t) => (
              <option key={t.number} value={`${t.number}|${t.name}`}>
                {t.number} – {t.name}
              </option>
            ))}
          </select>
          {teams.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--warning)', marginTop: 4 }}>
              No teams configured. Ask your admin to add teams in the Config page.
            </span>
          )}
        </div>

        <FieldTextarea
          label="Basic Design Description"
          required
          value={form.designDesc}
          onChange={set('designDesc')}
          placeholder="Describe the robot's design, notable mechanisms, unique features…"
          rows={3}
        />

        <FieldInput
          label="Total Fuel Capacity"
          required
          type="number"
          value={form.fuelCapacity}
          onChange={set('fuelCapacity')}
          placeholder="e.g. 10"
          min="0"
        />

        <MultiToggle
          label="Starting Position"
          required
          options={['1', '2', '3']}
          value={form.startingPosition}
          onChange={set('startingPosition')}
        />
        <MultiToggle
          label="Starting Alliance"
          required
          options={['Red', 'Blue']}
          value={form.startingAlliance}
          onChange={set('startingAlliance')}
        />

        <MultiSelectToggle
          label="Intake Mechanism"
          required
          options={['Human Player', 'Ground Intake']}
          value={form.intakeMech}
          onChange={set('intakeMech')}
        />

        <MultiToggle label="Speed" required options={['Slow', 'Medium', 'Fast']} value={form.speed} onChange={set('speed')} />
        <MultiToggle label="Speed When Crossing" required options={['Slow', 'Medium', 'Fast']} value={form.speedCrossing} onChange={set('speedCrossing')} />
        <Toggle label="Auto Tracking?" required value={form.autoTracking} onChange={set('autoTracking')} />
        <Toggle label="Shoot While Moving?" required value={form.shootMoving} onChange={set('shootMoving')} />

        <div className="field">
          <label>Photos</label>
          <input
            ref={inputRef}
            type="hidden"
            role="uploadcare-uploader"
            data-multiple="true"
            data-images-only="true"
            data-public-key="52c17ebdc1f9c6c7f786"
          />
          {photoUrls.length > 0 && (
            <div className="photo-names" style={{ marginTop: '8px' }}>
              {photoUrls.map((url, i) => (
                <span key={i} style={{ display: 'block', marginBottom: '4px', color: '#4CAF50' }}>
                  ✓ Photo {i + 1} uploaded
                </span>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      {/* ── Autonomous ──────────────────────────────────────────────────────── */}
      <FormSection title="Autonomous">
        <div className="field" style={{ gridColumn: '1 / -1' }}>
          <label>Routes <span className="req">*</span> <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 10 }}>(draw paths on the field)</span></label>
          <RouteCanvas value={form.autoRoutes} onChange={set('autoRoutes')} />
        </div>

        <VolumeInput
          label="Intaking Volume (fuel / sec)"
          required
          fuelVal={form.autoIntakeFuel} secVal={form.autoIntakeSec}
          onFuelChange={set('autoIntakeFuel')} onSecChange={set('autoIntakeSec')}
        />
        <VolumeInput
          label="Outtaking Volume (fuel / sec)"
          required
          fuelVal={form.autoOuttakeFuel} secVal={form.autoOuttakeSec}
          onFuelChange={set('autoOuttakeFuel')} onSecChange={set('autoOuttakeSec')}
        />
        <FieldInput
          label="Predicted Fuel Scored"
          required
          type="number"
          value={form.autoFuelScored}
          onChange={set('autoFuelScored')}
          min="0"
        />

        <Toggle label="Leave Point?" required value={form.leavePoint} onChange={set('leavePoint')} />
        <Toggle label="Climb?" required value={form.autoClimb} onChange={set('autoClimb')} />
        {form.autoClimb === 'yes' && (
          <div className="nested-options">
            <MultiToggle label="Climb Section" required options={['Left', 'Center', 'Right']} value={form.autoClimbSection} onChange={set('autoClimbSection')} />
            <MultiToggle label="Climb Level" required options={['Level 1', 'Level 2', 'Level 3']} value={form.autoClimbLevel} onChange={set('autoClimbLevel')} />
          </div>
        )}

        <Toggle label="Cross Past Hub?" required value={form.crossPastHub} onChange={set('crossPastHub')} />
        {form.crossPastHub === 'yes' && (
          <div className="nested-options">
            <MultiSelectToggle
              label="Cross Path"
              required
              options={['Left Bump', 'Right Bump', 'Left Trench', 'Right Trench']}
              value={form.crossPath}
              onChange={set('crossPath')}
            />
          </div>
        )}
      </FormSection>

      {/* ── Teleop ──────────────────────────────────────────────────────────── */}
      <FormSection title="Teleop">
        <VolumeInput
          label="Intaking Volume (fuel / sec)"
          required
          fuelVal={form.teleopIntakeFuel} secVal={form.teleopIntakeSec}
          onFuelChange={set('teleopIntakeFuel')} onSecChange={set('teleopIntakeSec')}
        />
        <VolumeInput
          label="Outtaking Volume (fuel / sec)"
          required
          fuelVal={form.teleopOuttakeFuel} secVal={form.teleopOuttakeSec}
          onFuelChange={set('teleopOuttakeFuel')} onSecChange={set('teleopOuttakeSec')}
        />
        <FieldInput
          label="Predicted Fuel Scored"
          required
          type="number"
          value={form.teleopFuelScored}
          onChange={set('teleopFuelScored')}
          min="0"
        />

        <Toggle label="Climb?" required value={form.teleopClimb} onChange={set('teleopClimb')} />
        {form.teleopClimb === 'yes' && (
          <div className="nested-options">
            <MultiToggle label="Climb Section" required options={['Left', 'Center', 'Right']} value={form.teleopClimbSection} onChange={set('teleopClimbSection')} />
            <MultiToggle label="Climb Level" required options={['Level 1', 'Level 2', 'Level 3']} value={form.teleopClimbLevel} onChange={set('teleopClimbLevel')} />
          </div>
        )}

        <Toggle label="Cross Past Hub?" required value={form.teleopCrossPastHub} onChange={set('teleopCrossPastHub')} />
        {form.teleopCrossPastHub === 'yes' && (
          <div className="nested-options">
            <MultiSelectToggle
              label="Cross Path"
              required
              options={['Left Bump', 'Right Bump', 'Left Trench', 'Right Trench']}
              value={form.teleopCrossPath}
              onChange={set('teleopCrossPath')}
            />
          </div>
        )}
      </FormSection>

      {/* ── Notes ────────────────────────────────────────────────────────────── */}
      <FormSection title="Notes">
        <FieldTextarea
          label="Additional Notes"
          value={form.notes}
          onChange={set('notes')}
          placeholder="Any other observations about the robot..."
          rows={4}
        />
      </FormSection>

      <div className="form-actions">
        <button className="submit-btn" onClick={handleSubmit} disabled={uploading}>
          {uploading ? 'Submitting...' : 'Submit Entry'}
        </button>
      </div>
    </div>
  );
}

