# FRC Scouting App — Brophy Broncos

A full-featured multi-page React scouting application for FRC competitions.

## Project Structure

```
frc-scouting/
├── public/
│   └── index.html              # HTML shell + Google GSI script tag
├── src/
│   ├── index.js                # React entry point
│   ├── App.jsx                 # Root component — routing & state
│   │
│   ├── hooks/
│   │   ├── useGoogleAuth.js    # Google OAuth flow + domain restriction
│   │   └── useLiveEntries.js   # LocalStorage entries with 2s live polling
│   │
│   ├── utils/
│   │   ├── constants.js        # GOOGLE_CLIENT_ID, allowed domains, admin email
│   │   ├── storage.js          # getStore / setStore helpers
│   │   └── stats.js            # Reliability score + avg calculations
│   │
│   ├── components/
│   │   ├── AuthScreen.jsx      # Sign-in screen
│   │   ├── Nav.jsx             # Top navigation bar
│   │   ├── FormFields.jsx      # Reusable form primitives
│   │   ├── RouteCanvas.jsx     # Field drawing canvas
│   │   └── TeamDetailPage.jsx  # Shared detailed team view
│   │
│   ├── pages/
│   │   ├── InputPage.jsx       # Full scouting entry form
│   │   ├── ViewingPage.jsx     # Live team cards grid
│   │   ├── ConfigPage.jsx      # Admin: competition & team management
│   │   └── HistoryPage.jsx     # Archived competitions browser
│   │
│   └── styles/
│       ├── global.css          # CSS variables, resets, shared field styles
│       ├── nav.css             # Navigation bar styles
│       ├── auth.css            # Auth screen styles
│       └── pages.css           # Page-specific styles (cards, grid, config, etc.)
│
├── package.json
└── README.md
```

## Getting Started

```bash
npm install
npm start
```

Then open http://localhost:3000

## Deployment

```bash
npm run build
```

Upload the `build/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.).

**Important:** Add your deployed URL to the Google Cloud Console under
Credentials → OAuth Client → Authorized JavaScript Origins.

## Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or select an existing one)
3. Enable the **Google Identity** API
4. Go to **APIs & Services → OAuth consent screen** → External → fill in app name
5. Go to **Credentials → Create Credentials → OAuth 2.0 Client ID** → Web application
6. Add your site URL to **Authorized JavaScript Origins**
7. The Client ID is already set in `src/utils/constants.js`

## Access Control

- Any `@brophybroncos.org` or `@brophyprep.org` Google account can sign in
- Only `lmckenna27@brophybroncos.org` can access the Configuration page

To change these, edit `src/utils/constants.js`:

```js
export const ALLOWED_DOMAINS = ['brophybroncos.org', 'brophyprep.org'];
export const ADMIN_EMAIL     = 'lmckenna27@brophybroncos.org';
```
# broncobots-scouting
