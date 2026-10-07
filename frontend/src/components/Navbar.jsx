import { NavLink, Link } from 'react-router-dom';

const links = [
  { to: '/', icon: 'dashboard', label: 'Dashboard' },
  { to: '/emergency', icon: 'emergency', label: 'Emergency' },
  { to: '/trip', icon: 'directions_walk', label: 'Trip' },
  { to: '/report', icon: 'flag', label: 'Report' },
];

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <h1>Suraksha</h1>
        <span className="hindi">सुरक्षा</span>
      </Link>
      <div className="nav-links">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="material-icons-round">{l.icon}</span>
            <span>{l.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
