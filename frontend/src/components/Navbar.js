import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/navbar.css';

const Navbar = () => {
  const { language, t, toggleLanguage } = useContext(LanguageContext);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <nav className="navbar" dir={language === 'am' ? 'rtl' : 'ltr'}>
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          💰 {t('earn_platform')}
        </Link>
        
        <ul className="nav-menu">
          <li><Link to="/dashboard">{t('dashboard')}</Link></li>
          <li><Link to="/tasks">{t('tasks')}</Link></li>
          <li><Link to="/orders">{t('orders')}</Link></li>
          <li><Link to="/earnings">{t('earnings')}</Link></li>
          <li><Link to="/profile">{t('profile')}</Link></li>
        </ul>

        <div className="navbar-actions">
          <button className="language-toggle" onClick={toggleLanguage}>
            {language === 'en' ? 'አማርኛ' : 'English'}
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            {t('logout')}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
