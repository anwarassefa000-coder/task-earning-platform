import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../context/LanguageContext';
import '../styles/orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const { language, t } = useContext(LanguageContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const query = filter !== 'all' ? `?status=${filter}` : '';
        const response = await fetch(`/api/orders${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders);
        }
      } catch (error) {
        console.error('Error fetching orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [filter]);

  const getStatusColor = (status) => {
    const colors = {
      'pending': '#FFA500',
      'confirmed': '#4169E1',
      'processing': '#FF6347',
      'shipped': '#9370DB',
      'delivered': '#32CD32',
      'cancelled': '#DC143C'
    };
    return colors[status] || '#808080';
  };

  if (loading) return <div>{t('loading')}</div>;

  return (
    <div className="orders-container" dir={language === 'am' ? 'rtl' : 'ltr'}>
      <h1>{t('orders')}</h1>
      
      <div className="filter-controls">
        {['all', 'pending', 'processing', 'delivered'].map(status => (
          <button
            key={status}
            className={filter === status ? 'active' : ''}
            onClick={() => setFilter(status)}
          >
            {t(status === 'all' ? 'all_orders' : status)}
          </button>
        ))}
      </div>

      <div className="orders-table">
        {orders.length === 0 ? (
          <p>{t('no_results')}</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('order_id')}</th>
                <th>{t('amount')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
                <th>{t('action')}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order._id}>
                  <td>{order.orderId}</td>
                  <td>${order.totalAmount.toFixed(2)}</td>
                  <td>
                    <span 
                      className="status-badge" 
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {t(order.status)}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    <a href={`/orders/${order._id}`}>{t('view_details')}</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Orders;
