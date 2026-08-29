# Task Earning Platform 💰

A comprehensive task earning website with VIP levels, order monitoring, and real-time payment processing. Built with Node.js, Express, MongoDB, and React with full **Amharic language support**.

## Features ✨

### Core Features
- 👤 **User Authentication** - Secure login/registration with JWT
- 💼 **Task Management** - Create, accept, and complete tasks
- 📦 **Order System** - Complete order lifecycle management
- 💰 **Payment Processing** - Stripe integration, wallet system, withdrawals
- 📊 **Real-time Dashboard** - Live earnings tracking and statistics
- 🔔 **Notifications** - Real-time order and payment alerts via Socket.io

### VIP System
- 🥉 **Bronze** - Starter level (0 earnings)
- 🥈 **Silver** - 5% bonus on rewards (≥$100 earnings)
- 🏅 **Gold** - 10% bonus on rewards (≥$500 earnings)
- 💎 **Platinum** - 15% bonus on rewards (≥$1000 earnings)
- ✨ **Diamond** - 20% bonus + priority support (≥$5000 earnings)

### Order Monitoring Service
- ✅ Automated order processing every 5 seconds
- 👥 Intelligent worker assignment
- 💳 Automatic payment processing
- 📈 Retry mechanism for failed orders
- 🏥 Health check and monitoring dashboard

### Language Support 🌍
- **English** - Full English interface
- **Amharic (አማርኛ)** - Complete Amharic translation
- **RTL Support** - Proper right-to-left text rendering for Amharic

## Quick Start 🚀

### Backend Setup
```bash
git clone https://github.com/anwarassefa000-coder/task-earning-platform.git
cd task-earning-platform
npm install
cp .env.example .env
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Order Monitor
```bash
npm run monitor
```

## API Endpoints 📡

See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete API reference.

## Project Structure 📁

- `/models` - Database schemas
- `/routes` - API endpoints
- `/middleware` - Auth & validation
- `/services` - Order monitoring
- `/localization` - Amharic translations
- `/frontend` - React application

## Tech Stack 🛠️

**Backend:** Node.js, Express, MongoDB, Socket.io, Stripe
**Frontend:** React 18, React Router, CSS3
**Deployment:** Docker, Heroku, GitHub Actions

## Contributing 🤝

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License 📄

MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ by anwarassefa000-coder**
