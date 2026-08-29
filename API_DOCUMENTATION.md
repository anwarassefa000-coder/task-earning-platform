# Task Earning Platform - API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected endpoints require:
```
Headers: Authorization: Bearer {jwt_token}
```

## Endpoints

### Auth
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/logout` - Logout

### Users
- `GET /users/profile/:userId` - Get user profile
- `PUT /users/profile` - Update profile
- `GET /users/stats` - Get user stats
- `GET /users/leaderboard` - Get leaderboard
- `GET /users/earnings` - Get earnings history

### Tasks
- `GET /tasks` - List tasks
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create task
- `POST /tasks/:id/accept` - Accept task
- `POST /tasks/:id/submit` - Submit work

### Orders
- `GET /orders` - List orders
- `GET /orders/:id` - Get order details
- `POST /orders` - Create order
- `POST /orders/:id/assign` - Assign worker
- `PUT /orders/:id/status` - Update status
- `POST /orders/:id/complete` - Complete order

### VIP
- `GET /vip/levels` - Get all VIP levels
- `GET /vip/:level` - Get level details
- `GET /vip/info/current` - Get current VIP info
- `POST /vip/check-upgrade` - Check upgrade
- `GET /vip/compare/all` - Compare all levels

### Payments
- `GET /payments/history` - Payment history
- `GET /payments/wallet/balance` - Wallet balance
- `POST /payments/withdrawal/request` - Request withdrawal
- `POST /payments/deposit` - Make deposit
- `GET /payments/admin/withdrawals` - Admin: List withdrawals
- `POST /payments/admin/withdrawal/:id/approve` - Admin: Approve withdrawal

### Dashboard
- `GET /dashboard/user` - User dashboard
- `GET /dashboard/admin` - Admin dashboard
- `GET /dashboard/analytics` - User analytics

## Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error
