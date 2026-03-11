import { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEYS = {
  ASSETS: 'display_assets',
  SETTINGS: 'display_settings',
  CURRENT_INDEX: 'display_current_index'
};

const SLIDE_DURATION = 0.6; // seconds for slide-in and slide-out each

export default function MonitorPage() {
  const [assets, setAssets] = useState([]);
  const [settings, setSettings] = useState({
    autoRotate: true,
    orientation: 'horizontal',
    backgroundColor: '#000000',
    backgroundImage: '',
    transition: 'slide'
  });
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // animKey only increments when the actual asset changes, never on settings changes
  const [animKey, setAnimKey] = useState(0);

  const containerRef = useRef(null);
  const pdfScrollInterval = useRef(null);
  const rotationTimeoutRef = useRef(null);
  const channelRef = useRef(null);
  const pdfContainerRef = useRef(null);

  // Refs that mirror state — lets timers always read latest values without restarting
  const settingsRef = useRef(settings);
  const assetsRef = useRef(assets);
  const currentIndexRef = useRef(currentIndex);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { assetsRef.current = assets; }, [assets]);
  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const savedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
      const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
      if (savedAssets) {
        const parsed = JSON.parse(savedAssets);
        parsed.sort((a, b) => a.order - b.order);
        setAssets(parsed);
      }
      if (savedSettings) setSettings(JSON.parse(savedSettings));
      if (savedIndex !== null) setCurrentIndex(parseInt(savedIndex, 10));
    } catch (e) {}
  }, []);

  // BroadcastChannel listener — settings updates never touch animKey
  useEffect(() => {
    try {
      channelRef.current = new BroadcastChannel('display_sync');
      channelRef.current.onmessage = (event) => {
        if (event.data?.type !== 'STATE_UPDATE') return;
        const { assets: newAssets, settings: newSettings, currentIndex: newIndex } = event.data;

        if (newAssets) {
          const sorted = [...newAssets].sort((a, b) => a.order - b.order);
          setAssets(sorted);
        }

        // Settings update: just update state/ref, never touch animKey or timer
        if (newSettings) {
          setSettings(newSettings);
          // ref is updated via the useEffect above, but set it immediately too
          // so any in-flight timer reads the new value
          settingsRef.current = newSettings;
        }

        // Index update (manual nav from DisplayPage): bump animKey + update index
        if (newIndex !== undefined) {
          setCurrentIndex(prev => {
            if (prev !== newIndex) {
              setAnimKey(k => k + 1);
            }
            return newIndex;
          });
        }
      };
    } catch (e) {}
    return () => { try { channelRef.current?.close(); } catch (e) {} };
  }, []);

  // localStorage polling fallback
  useEffect(() => {
    if (typeof BroadcastChannel !== 'undefined') return;
    const poll = setInterval(() => {
      try {
        const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
        const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const savedAssets = localStorage.getItem(STORAGE_KEYS.ASSETS);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          setSettings(parsed);
          settingsRef.current = parsed;
        }
        if (savedAssets) {
          const parsed = JSON.parse(savedAssets);
          parsed.sort((a, b) => a.order - b.order);
          setAssets(parsed);
        }
        if (savedIndex !== null) {
          const newIndex = parseInt(savedIndex, 10);
          setCurrentIndex(prev => {
            if (prev !== newIndex) setAnimKey(k => k + 1);
            return newIndex;
          });
        }
      } catch (e) {}
    }, 1000);
    return () => clearInterval(poll);
  }, []);

  // Auto-rotation — skips PDFs entirely (PDF scroll effect handles advancing)
  useEffect(() => {
    if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current);

    const s = settingsRef.current;
    const a = assetsRef.current;
    const asset = a[currentIndex];

    // If current asset is a PDF, don't schedule — PDF scroll handles when it's done
    if (!s.autoRotate || a.length === 0 || asset?.type === 'pdf') return;

    // Always use per-asset duration
    const interval = (asset?.duration || 10) * 1000;

    rotationTimeoutRef.current = setTimeout(() => {
      setAnimKey(k => k + 1);
      setCurrentIndex(prev => {
        const newIndex = (prev + 1) % assetsRef.current.length;
        try { localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, newIndex.toString()); } catch (e) {}
        return newIndex;
      });
    }, interval);

    return () => { if (rotationTimeoutRef.current) clearTimeout(rotationTimeoutRef.current); };
  }, [currentIndex, assets.length, settings.autoRotate]); // eslint-disable-line react-hooks/exhaustive-deps

  // PDF scroll — uses CSS transform to scroll iframe up, no cross-origin access needed
  useEffect(() => {
    const currentAsset = assets[currentIndex];

    if (currentAsset?.type !== 'pdf') {
      if (pdfScrollInterval.current) { clearInterval(pdfScrollInterval.current); pdfScrollInterval.current = null; }
      return;
    }

    if (rotationTimeoutRef.current) { clearTimeout(rotationTimeoutRef.current); rotationTimeoutRef.current = null; }

    let currentOffset = 0;

    const scrollDelay = setTimeout(() => {
      const wrapper = pdfContainerRef.current;
      if (!wrapper) return;
      const iframe = wrapper.querySelector('iframe');
      if (!iframe) return;

      // Reset
      currentOffset = 0;
      iframe.style.transform = 'translateY(0px)';

      const containerH = wrapper.clientHeight;
      const pageCount = assets[currentIndex]?.pageCount ?? 1;
      const totalScrollable = containerH * (pageCount - 1);

      pdfScrollInterval.current = setInterval(() => {
        const a = assetsRef.current;
        const idx = currentIndexRef.current;
        const asset = a[idx];

        if (asset?.type !== 'pdf') {
          clearInterval(pdfScrollInterval.current);
          pdfScrollInterval.current = null;
          return;
        }

        const speed = asset?.scrollSpeed ?? 50;
        const step = (speed / 10) * (16 / 50);

        if (currentOffset + step < totalScrollable) {
          currentOffset += step;
          iframe.style.transform = `translateY(-${currentOffset}px)`;
        } else {
          // Reached bottom — advance to next asset
          currentOffset = totalScrollable;
          iframe.style.transform = `translateY(-${currentOffset}px)`;
          clearInterval(pdfScrollInterval.current);
          pdfScrollInterval.current = null;

          const s = settingsRef.current;
          if (s.autoRotate) {
            setAnimKey(k => k + 1);
            setCurrentIndex(prev => {
              const newIndex = (prev + 1) % assetsRef.current.length;
              try { localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, newIndex.toString()); } catch (e) {}
              return newIndex;
            });
          }
        }
      }, 16);
    }, 2000);

    return () => {
      clearTimeout(scrollDelay);
      if (pdfScrollInterval.current) { clearInterval(pdfScrollInterval.current); pdfScrollInterval.current = null; }
    };
  }, [currentIndex, assets]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleEnterFullscreen = useCallback(() => {
    setShowFullscreenPrompt(false);
    const elem = document.documentElement;
    const request = elem.requestFullscreen?.bind(elem) || elem.webkitRequestFullscreen?.bind(elem);
    if (request) Promise.resolve(request()).catch(() => {});
  }, []);

  const handleSkipFullscreen = useCallback(() => {
    setShowFullscreenPrompt(false);
  }, []);

  // Inject keyframes — recompute percentages when interval changes so
  // slide-in and slide-out are always a fixed 0.6s, freeze fills the rest.
  useEffect(() => {
    const total = assets[currentIndex]?.duration || 10;

    const inPct  = ((SLIDE_DURATION / total) * 100).toFixed(2);
    const outPct = (100 - (SLIDE_DURATION / total) * 100).toFixed(2);

    const styleSheet = document.createElement('style');
    styleSheet.id = 'monitor-keyframes';
    styleSheet.textContent = `
      @keyframes slideH {
        0%       { transform: translateX(-100%); animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
        ${inPct}%  { transform: translateX(0);     animation-timing-function: step-start; }
        ${outPct}% { transform: translateX(0);     animation-timing-function: cubic-bezier(0.4,0,0.2,1); }
        100%     { transform: translateX(100%);  }
      }
      .slide-wrap {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        position: relative;
      }
      .slide-wrap.animate-h {
        animation: slideH ${total}s linear forwards;
      }
      .asset-rotate-vertical {
        transform: rotate(-90deg);
        transform-origin: center center;
      }
      .pdf-viewer-container {
        overflow: auto !important;
        -webkit-overflow-scrolling: touch;
      }
      .pdf-viewer-container::-webkit-scrollbar { width: 8px; height: 8px; }
      .pdf-viewer-container::-webkit-scrollbar-track { background: #333; }
      .pdf-viewer-container::-webkit-scrollbar-thumb { background: #666; border-radius: 4px; }
    `;
    const existing = document.getElementById('monitor-keyframes');
    if (existing) existing.remove();
    document.head.appendChild(styleSheet);
    return () => { styleSheet.remove(); };
  }, [currentIndex, assets]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentAsset = assets[currentIndex];
  const isVertical = settings.orientation === 'vertical';
  const useSlide = settings.transition === 'slide';

  const animClass = useSlide
    ? 'slide-wrap animate-h'  // always translateX — content rotation handles visual direction
    : 'slide-wrap';

  const backgroundStyle = settings.backgroundImage
    ? { backgroundImage: `url(${settings.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: settings.backgroundColor };

  const assetStyle = isVertical
    ? { maxWidth: '95vh', maxHeight: '95vw', objectFit: 'contain' }
    : { maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' };

  const iframeStyle = isVertical
    ? { width: '95vh', height: '95vw', border: 'none', borderRadius: 8, background: '#fff' }
    : { width: '95vw', height: '95vh', border: 'none', borderRadius: 8, background: '#fff' };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw', height: '100vh',
        ...backgroundStyle,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {showFullscreenPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400 }}>
            <h2 style={{ marginBottom: 16, fontSize: 24, color: '#f5f5f5' }}>Monitor Display</h2>
            <p style={{ color: '#888', marginBottom: 24 }}>Enter fullscreen for best viewing experience.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={handleEnterFullscreen} style={{ background: '#991b1b', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 24px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                Enter Fullscreen
              </button>
              <button onClick={handleSkipFullscreen} style={{ background: '#1a1a1a', color: '#f5f5f5', border: '1px solid #2a2a2a', borderRadius: 8, padding: '12px 24px', fontSize: 16, cursor: 'pointer' }}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {assets.length === 0 ? (
        <div style={{ color: '#888', fontSize: 24 }}>No assets to display</div>
      ) : (
        // key=animKey only changes when asset actually switches
        <div key={animKey} className={animClass}>
          <div className={isVertical ? 'asset-rotate-vertical' : ''}>
            {currentAsset?.type === 'image' && (
              <img src={currentAsset.data.src} alt="" style={assetStyle} />
            )}
            {currentAsset?.type === 'pdf' && (
              <div
                ref={pdfContainerRef}
                style={{
                  width: iframeStyle.width,
                  height: iframeStyle.height,
                  overflow: 'hidden',
                  borderRadius: 8,
                  position: 'relative',
                }}
              >
                <iframe
                  src={currentAsset.data.src + '#toolbar=0&navpanes=0&scrollbar=0'}
                  title="PDF Viewer"
                  style={{
                    width: '100%',
                    height: `${(currentAsset.pageCount ?? 1) * 100}%`,
                    border: 'none',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    willChange: 'transform',
                  }}
                />
              </div>
            )}
            {currentAsset?.type === 'desmos' && (
              <iframe src={currentAsset.data.url} title="Desmos Graph" style={iframeStyle} />
            )}
            {currentAsset?.type === 'embed' && (
              <iframe src={currentAsset.data.url} title="Embedded Content" style={iframeStyle} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}