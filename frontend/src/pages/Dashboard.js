import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/dashboard.css';

const Dashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { language, t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setDashboard(data);
        } else {
          setError(t('error'));
        }
      } catch (err) {
        setError(t('server_error'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [t]);

  if (loading) return <div>{t('loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="dashboard-container" dir={language === 'am' ? 'rtl' : 'ltr'}>
      <div className="dashboard-header">
        <h1>{t('welcome')}, {dashboard?.user.firstName || dashboard?.user.username}</h1>
        <div className="vip-badge">
          <span className="badge" style={{ backgroundColor: dashboard?.vipInfo?.badgeColor }}>
            {t(dashboard?.user.vipLevel)}
          </span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{t('total_earnings')}</h3>
          <p className="stat-value">${dashboard?.stats.totalEarnings.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>{t('account_balance')}</h3>
          <p className="stat-value">${dashboard?.stats.accountBalance.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h3>{t('tasks_completed')}</h3>
          <p className="stat-value">{dashboard?.stats.tasksCompleted}</p>
        </div>
        <div className="stat-card">
          <h3>{t('orders_completed')}</h3>
          <p className="stat-value">{dashboard?.stats.ordersCompleted}</p>
        </div>
      </div>

      <div className="vip-progress">
        <h2>{t('vip_level')}</h2>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${dashboard?.vipInfo?.minPoints}%` }}
          ></div>
        </div>
        <p>{t('progress')}: {Math.round(dashboard?.vipInfo?.minPoints || 0)}%</p>
      </div>

      <div className="recent-items">
        <div className="recent-tasks">
          <h2>{t('tasks')}</h2>
          {dashboard?.recentTasks?.map(task => (
            <div key={task._id} className="item-card">
              <h4>{task.title}</h4>
              <p>${task.reward}</p>
            </div>
          ))}
        </div>

        <div className="recent-orders">
          <h2>{t('orders')}</h2>
          {dashboard?.recentOrders?.map(order => (
            <div key={order._id} className="item-card">
              <h4>{order.orderId}</h4>
              <p>{t(order.status)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
