export const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

export const ALLOWED_DOMAINS = (process.env.REACT_APP_ALLOWED_DOMAINS || 'brophybroncos.org,brophyprep.org').split(',');

export const ADMIN_EMAIL = process.env.REACT_APP_ADMIN_EMAIL || '';

export const STORAGE_KEYS = {
  ENTRIES: 'frc_entries',
  CONFIG:  'frc_config',
  HISTORY: 'frc_history',
  USER:    'frc_user',
};
