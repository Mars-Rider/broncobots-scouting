/** Shared form-field components used across pages. */

export function FieldSelect({ label, options, value, onChange, required }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Select —</option>
        {options.map((o) =>
          typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
    </div>
  );
}

export function FieldInput({ label, type = 'text', value, onChange, placeholder, required, min, max }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
      />
    </div>
  );
}

export function FieldTextarea({ label, value, onChange, placeholder, rows = 3, required }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

export function Toggle({ label, value, onChange, required }) {
  return (
    <div className="field toggle-field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <div className="toggle-group">
        {['yes', 'no'].map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`toggle-btn ${value === opt ? 'active' : ''}`}
          >
            {opt === 'yes' ? 'Yes' : 'No'}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MultiToggle({ label, options, value, onChange, required, isAlliance }) {
  return (
    <div className="field toggle-field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <div className="toggle-group">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={`toggle-btn ${isAlliance ? `alliance-${opt.toLowerCase()}` : ''} ${value === opt ? 'active' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Select ALL that apply — value is an array of selected strings */
export function MultiSelectToggle({ label, options, value = [], onChange, required }) {
  // Ensure value is always an array
  const safeValue = Array.isArray(value) ? value : [];
  
  const toggle = (opt) => {
    const next = safeValue.includes(opt)
      ? safeValue.filter((v) => v !== opt)
      : [...safeValue, opt];
    onChange(next);
  };
  return (
    <div className="field toggle-field">
      <label>{label}{required && <span className="req">*</span>} <span style={{ fontWeight: 400, opacity: 0.6, fontSize: 10 }}>(select all that apply)</span></label>
      <div className="toggle-group">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`toggle-btn ${safeValue.includes(opt) ? 'active' : ''}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function VolumeInput({ label, fuelVal, secVal, onFuelChange, onSecChange, required }) {
  return (
    <div className="field">
      <label>{label}{required && <span className="req">*</span>}</label>
      <div className="volume-inputs">
        <input
          type="number"
          value={fuelVal}
          onChange={(e) => onFuelChange(e.target.value)}
          placeholder="# fuel"
          min="0"
        />
        <span>/</span>
        <input
          type="number"
          value={secVal}
          onChange={(e) => onSecChange(e.target.value)}
          placeholder="# sec"
          min="0"
        />
      </div>
    </div>
  );
}

export function FormSection({ title, children }) {
  return (
    <div className="form-section">
      <div className="section-header">
        {title}
      </div>
      <div className="section-body">{children}</div>
    </div>
  );
}
