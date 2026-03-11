import { useState, useEffect, useRef, useCallback } from 'react';

// Storage keys for localStorage (persisting data only, not for cross-window comms)
const STORAGE_KEYS = {
  ASSETS: 'display_assets',
  SETTINGS: 'display_settings',
  CURRENT_INDEX: 'display_current_index'
};

// Default settings
const DEFAULT_SETTINGS = {
  autoRotate: true,
  orientation: 'horizontal',
  backgroundColor: '#000000',
  backgroundImage: '',
  transition: 'none'
};

const createAsset = (type, data = {}) => ({
  id: Date.now() + Math.random(),
  type,
  data,
  duration: 10,
  scrollSpeed: 50,
  pageCount: 1,
  order: 0
});

// BroadcastChannel for cross-window communication
const getChannel = () => {
  try {
    return new BroadcastChannel('display_sync');
  } catch (e) {
    return null;
  }
};

export default function DisplayPage({ user }) {
  const [assets, setAssets] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [desmosUrl, setDesmosUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [bgColor, setBgColor] = useState('#000000');
  const [bgImage, setBgImage] = useState('');
  const fileInputRef = useRef(null);
  const pdfInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const channelRef = useRef(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    channelRef.current = getChannel();
    return () => {
      channelRef.current?.close();
    };
  }, []);

  // Broadcast state to monitor window.
  // updatedIndex should only be passed when explicitly navigating — never on settings changes.
  const broadcast = useCallback((updatedAssets, updatedSettings, updatedIndex = null) => {
    try {
      const msg = { type: 'STATE_UPDATE', assets: updatedAssets, settings: updatedSettings };
      if (updatedIndex !== null) msg.currentIndex = updatedIndex;
      channelRef.current?.postMessage(msg);
    } catch (e) {}
  }, []);

  // Load saved data from localStorage on mount
  useEffect(() => {
    try {
      const savedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);

      let loadedAssets = [];
      let loadedSettings = DEFAULT_SETTINGS;
      let loadedIndex = 0;

      if (savedAssets) {
        loadedAssets = JSON.parse(savedAssets);
        setAssets(loadedAssets);
      }
      if (savedSettings) {
        loadedSettings = JSON.parse(savedSettings);
        setSettings(loadedSettings);
        setBgColor(loadedSettings.backgroundColor || '#000000');
        setBgImage(loadedSettings.backgroundImage || '');
      }
      if (savedIndex !== null) {
        loadedIndex = parseInt(savedIndex, 10);
        setCurrentIndex(loadedIndex);
      }
    } catch (err) {
      console.error('Error loading display data:', err);
    }
  }, []);

  // Persist assets and broadcast
  const saveAssets = useCallback((newAssets, newSettings = null, newIndex = null) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(newAssets));
    } catch (err) {
      console.error('Error saving assets:', err);
    }
    // Never send currentIndex here — monitor manages its own index
    const s = newSettings !== null ? newSettings : settings;
    broadcast(newAssets, s);
  }, [settings, broadcast]);

  // Persist settings and broadcast — never sends currentIndex
  const saveSettings = useCallback((newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
    } catch (err) {
      console.error('Error saving settings:', err);
    }
    broadcast(assets, newSettings);
  }, [assets, broadcast]);

  // Persist index and broadcast — the ONLY place currentIndex is sent to monitor
  const saveIndex = useCallback((newIndex, currentAssets = null, currentSettings = null) => {
    setCurrentIndex(newIndex);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, newIndex.toString());
    } catch (err) {
      console.error('Error saving index:', err);
    }
    broadcast(currentAssets || assets, currentSettings || settings, newIndex);
  }, [assets, settings, broadcast]);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    let loadedCount = 0;
    const newAssets = [...assets];

    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const newAsset = createAsset('image', { src: event.target.result, name: file.name });
          newAssets.push({ ...newAsset, order: newAssets.length });
          loadedCount++;
          if (loadedCount === files.length) {
            setAssets(newAssets);
            saveAssets(newAssets);
          }
        };
        reader.readAsDataURL(file);
      } else {
        loadedCount++;
      }
    });
    e.target.value = '';
  };

  // Handle PDF upload
  const handlePdfUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAsset = createAsset('pdf', { src: event.target.result, name: file.name });
        const newAssets = [...assets, { ...newAsset, order: assets.length }];
        setAssets(newAssets);
        saveAssets(newAssets);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Handle Desmos URL
  const handleAddDesmos = () => {
    if (desmosUrl.trim()) {
      let url = desmosUrl.trim();
      if (!url.includes('embed')) {
        url = url + (url.includes('?') ? '&' : '?') + 'embed';
      }
      const newAsset = createAsset('desmos', { url });
      const newAssets = [...assets, { ...newAsset, order: assets.length }];
      setAssets(newAssets);
      saveAssets(newAssets);
      setDesmosUrl('');
    }
  };

  // Handle embed URL
  const handleAddEmbed = () => {
    if (embedUrl.trim()) {
      const newAsset = createAsset('embed', { url: embedUrl.trim(), name: 'Embedded Site' });
      const newAssets = [...assets, { ...newAsset, order: assets.length }];
      setAssets(newAssets);
      saveAssets(newAssets);
      setEmbedUrl('');
    }
  };

  // Handle background image upload
  const handleBgImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target.result);
        saveSettings({ ...settings, backgroundImage: event.target.result });
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  // Drag and drop reordering
  const handleDragStart = (index) => setDraggedIndex(index);

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newAssets = [...assets];
    const dragged = newAssets[draggedIndex];
    newAssets.splice(draggedIndex, 1);
    newAssets.splice(index, 0, dragged);
    newAssets.forEach((asset, i) => { asset.order = i; });
    setDraggedIndex(index);
    setAssets(newAssets);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) saveAssets(assets);
    setDraggedIndex(null);
  };

  const removeAsset = (id) => {
    const newAssets = assets.filter(a => a.id !== id);
    newAssets.forEach((asset, i) => { asset.order = i; });
    setAssets(newAssets);
    saveAssets(newAssets);
  };

  const moveAsset = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= assets.length) return;
    const newAssets = [...assets];
    [newAssets[index], newAssets[newIndex]] = [newAssets[newIndex], newAssets[index]];
    newAssets.forEach((asset, i) => { asset.order = i; });
    setAssets(newAssets);
    saveAssets(newAssets);
  };

  const updateAssetDuration = (id, value, field = 'duration') => {
    const newAssets = assets.map(a =>
      a.id === id ? { ...a, [field]: parseInt(value) } : a
    );
    setAssets(newAssets);
    saveAssets(newAssets);
  };

  const openMonitor = () => {
    const monitor = window.open('/monitor', 'Monitor', 'width=1200,height=800');
    // Send initial state once monitor is ready
    setTimeout(() => {
      broadcast(assets, settings, currentIndex);
    }, 500);
  };

  const navigate = (direction) => {
    const newSettings = { ...settings, autoRotate: false };
    setSettings(newSettings);
    try { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings)); } catch (e) {}

    const newIndex = direction === 'next'
      ? (currentIndex + 1) % assets.length
      : (currentIndex - 1 + assets.length) % assets.length;

    saveIndex(newIndex, assets, newSettings);
  };

  const toggleAutoRotate = () => saveSettings({ ...settings, autoRotate: !settings.autoRotate });
  const updateOrientation = (orientation) => saveSettings({ ...settings, orientation });
  const updateBgColor = (color) => { setBgColor(color); saveSettings({ ...settings, backgroundColor: color, backgroundImage: '' }); };
  const clearBgImage = () => { setBgImage(''); saveSettings({ ...settings, backgroundImage: '' }); };
  const updateTransition = (transition) => saveSettings({ ...settings, transition });

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>Display Control</h1>
        <p>Manage what displays on the monitor for pit judging</p>
      </div>

      <div style={{ marginBottom: 24, display: 'flex', gap: 12 }}>
        <button className="save-btn" onClick={openMonitor} style={{ color: '#fff', fontWeight: 700, fontFamily: 'Poppins, var(--font-body), sans-serif' }}>
          Open Monitor Tab
        </button>
      </div>

      {assets.length > 0 && (
        <div className="form-section">
          <div className="section-header">Monitor Controls
          </div>
          <div className="section-body">
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button className="cancel-btn" onClick={() => navigate('prev')}>← Previous</button>
              <button className="cancel-btn" onClick={() => navigate('next')}>Next →</button>
            </div>
          </div>
        </div>
      )}

      <div className="form-section">
        <div className="section-header">Display Settings
        </div>
        <div className="section-body">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <label style={{ margin: 0 }}>Auto-Rotate Assets</label>
            <button className={`toggle-btn ${settings.autoRotate ? 'active' : ''}`} onClick={toggleAutoRotate} style={{ width: 'auto', padding: '4px 12px' }}>
              {settings.autoRotate ? 'On' : 'Off'}
            </button>
          </div>

          <div className="toggle-field">
            <label>Monitor Orientation</label>
            <div className="toggle-group">
              <button className={`toggle-btn ${settings.orientation === 'horizontal' ? 'active' : ''}`} onClick={() => updateOrientation('horizontal')}>Horizontal</button>
              <button className={`toggle-btn ${settings.orientation === 'vertical' ? 'active' : ''}`} onClick={() => updateOrientation('vertical')}>Vertical</button>
            </div>
          </div>

          <div className="toggle-field">
            <label>Transition Effect</label>
            <div className="toggle-group">
              <button className={`toggle-btn ${settings.transition === 'none' ? 'active' : ''}`} onClick={() => updateTransition('none')}>None</button>
              <button className={`toggle-btn ${settings.transition === 'slide' ? 'active' : ''}`} onClick={() => updateTransition('slide')}>Slide</button>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">Background Settings
        </div>
        <div className="section-body">
          <div className="field">
            <label>Background Color</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input type="color" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} style={{ width: 50, height: 40, cursor: 'pointer', border: 'none' }} />
              <input type="text" value={bgColor} onChange={(e) => updateBgColor(e.target.value)} style={{ width: 100 }} />
            </div>
          </div>

          <div className="field">
            <label>Background Image</label>
            <input ref={bgImageInputRef} type="file" accept="image/*" onChange={handleBgImageUpload} style={{ display: 'none' }} />
            <button className="file-upload-btn" onClick={() => bgImageInputRef.current?.click()}>Upload Background Image</button>
            {bgImage && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src={bgImage} alt="Background preview" style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 4 }} />
                <button className="cancel-btn" onClick={clearBgImage}>Remove</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">Add Content
        </div>
        <div className="section-body">
          <div className="field">
            <label>Upload Images (select multiple)</label>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
            <button className="file-upload-btn" onClick={() => fileInputRef.current?.click()}>Add Images</button>
          </div>

          <div className="field">
            <label>Upload PDF</label>
            <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfUpload} style={{ display: 'none' }} />
            <button className="file-upload-btn" onClick={() => pdfInputRef.current?.click()}>Add PDF</button>
          </div>

          <div className="field">
            <label>Embed Desmos Graph</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Paste Desmos URL" value={desmosUrl} onChange={(e) => setDesmosUrl(e.target.value)} style={{ flex: 1 }} />
              <button className="archive-btn" onClick={handleAddDesmos}>Add Graph</button>
            </div>
          </div>

          <div className="field">
            <label>Embed Any Website</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" placeholder="Paste website URL" value={embedUrl} onChange={(e) => setEmbedUrl(e.target.value)} style={{ flex: 1 }} />
              <button className="archive-btn" onClick={handleAddEmbed}>Embed Site</button>
            </div>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="section-header">Assets ({assets.length})
        </div>
        <div className="section-body">
          {assets.length === 0 ? (
            <div className="empty-state">No assets yet. Add images, PDFs, or embedded content above.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {assets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="slide-item"
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', background: 'var(--surface2)',
                    border: '1px solid var(--border)', borderRadius: 8,
                    cursor: 'grab', opacity: draggedIndex === index ? 0.5 : 1,
                  }}
                >
                  <span style={{ color: 'var(--muted)', fontSize: 18 }}>=</span>
                  <span style={{ background: 'var(--accent)', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                    {index + 1}
                  </span>

                  {asset.type === 'image' && <img src={asset.data.src} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />}
                  {asset.type === 'pdf' && <div style={{ width: 60, height: 40, background: 'var(--danger)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>PDF</div>}
                  {asset.type === 'desmos' && <div style={{ width: 60, height: 40, background: '#626', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>GRAPH</div>}
                  {asset.type === 'embed' && <div style={{ width: 60, height: 40, background: '#069', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600 }}>WEB</div>}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{asset.data.name || asset.data.url?.substring(0, 40) || asset.type}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'capitalize' }}>{asset.type}</div>
                  </div>

                  {/* Duration — shown for all non-PDF assets */}
                  {asset.type !== 'pdf' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                      <label style={{ fontSize: 11, color: 'var(--muted)' }}>Duration</label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <input
                          type="number" min="3" max="300"
                          value={asset.duration}
                          onChange={(e) => updateAssetDuration(asset.id, e.target.value)}
                          style={{
                            width: 56, padding: '6px 8px', fontSize: 13,
                            background: 'var(--surface)', border: '1px solid var(--border2)',
                            borderRadius: 6, color: 'var(--text)', textAlign: 'center',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>s</span>
                      </div>
                    </div>
                  )}

                  {/* Scroll speed + page count — shown only for PDFs */}
                  {asset.type === 'pdf' && (
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Pages</label>
                        <input
                          type="number" min="1" max="999"
                          value={asset.pageCount ?? 1}
                          onChange={(e) => updateAssetDuration(asset.id, e.target.value, 'pageCount')}
                          style={{
                            width: 56, padding: '6px 8px', fontSize: 13,
                            background: 'var(--surface)', border: '1px solid var(--border2)',
                            borderRadius: 6, color: 'var(--text)', textAlign: 'center',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                        <label style={{ fontSize: 11, color: 'var(--muted)' }}>Speed</label>
                        <input
                          type="number" min="1" max="200"
                          value={asset.scrollSpeed ?? 50}
                          onChange={(e) => updateAssetDuration(asset.id, e.target.value, 'scrollSpeed')}
                          style={{
                            width: 56, padding: '6px 8px', fontSize: 13,
                            background: 'var(--surface)', border: '1px solid var(--border2)',
                            borderRadius: 6, color: 'var(--text)', textAlign: 'center',
                            fontFamily: 'var(--font-body)',
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <button className="remove-btn" onClick={() => removeAsset(asset.id)} style={{ marginLeft: 0 }}>X</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}