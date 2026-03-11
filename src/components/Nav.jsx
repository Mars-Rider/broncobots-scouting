import { Link } from 'react-router-dom';
import '../styles/nav.css';

export default function Nav({ currentPage, user, signOut, showLiveIndicator }) {
  const links = [
    { path: '/input',   label: 'Input' },
    { path: '/entries', label: 'Entries' },
    { path: '/history', label: 'History' },
    { path: '/display', label: 'Display' },
  ];
  if (user?.isAdmin) links.push({ path: '/config', label: 'Config', admin: true });

  return (
    <nav className="nav">
<img src="https://i.postimg.cc/k4SY1s2m/Asset-1.jpg" alt="" style={{ height: 28, marginRight: 8 }} />
      <span className="nav-brand">FRC Scout</span>

      {showLiveIndicator && (
        <div className="page-live-indicator">
          <div className="live-dot" />
          Live
        </div>
      )}

      <div className="nav-links">
        {links.map(({ path, label, admin }) => {
          const key = path.replace('/', '');
          const active = currentPage === key || (currentPage === '' && key === 'entries');
          return (
            <Link
              key={path}
              to={path}
              className={`nav-link ${active ? 'active' : ''} ${admin ? 'nav-link-admin' : ''}`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      <div className="nav-user">
        <span className="nav-user-name">{user?.name}</span>
        {user?.picture && (
          <img 
            src={user.picture} 
            alt="" 
            className="avatar"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <button className="sign-out-btn" onClick={signOut}>Sign Out</button>
      </div>
    </nav>
  );
}
