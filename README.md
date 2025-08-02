# SkillLink - Gaming Gig Platform

A comprehensive platform connecting gaming organizations with skilled players for gig opportunities. Built with React.js frontend and FastAPI backend.

## 🎮 Features

### Core Functionality
- **User Authentication & Authorization**
  - Player and Organization registration/login
  - JWT token-based authentication
  - Role-based access control

- **Gig Management**
  - Organizations can post gaming gigs with budgets
  - Players can browse and apply to gigs
  - Application status tracking (pending, accepted, rejected)
  - Gig lifecycle management (active → accepted → completed)

- **Wallet System**
  - Secure wallet for both players and organizations
  - Automatic fund locking when gigs are created
  - Payment processing for completed gigs
  - Transaction history and balance tracking
  - Add money and withdrawal functionality

- **Dashboard Systems**
  - **Player Dashboard**: View applications, active gigs, completed gigs
  - **Organization Dashboard**: Manage posted gigs, review applications, track hires
  - Real-time status updates and filtering

- **Profile Management**
  - User profile creation and editing
  - Avatar upload functionality
  - Skill and experience tracking

### Security Features
- Input sanitization and validation
- Secure token management
- Role-based authorization
- Data encryption and protection
- XSS and injection attack prevention

## 🛠️ Technology Stack

### Frontend
- **React.js** - UI framework
- **React Router** - Navigation and routing
- **Tailwind CSS** - Styling and responsive design
- **React Icons** - Icon library
- **Vite** - Build tool and development server

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **PyMongo** - MongoDB driver
- **JWT** - Authentication tokens
- **Uvicorn** - ASGI server

### Database Models
- **User** - Player and organization accounts
- **Gig** - Gaming opportunities with budgets
- **Application** - Player applications to gigs
- **Wallet** - Financial management
- **WalletTransaction** - Payment tracking
- **Message** - Communication system
- **Endorsement** - Skill verification
- **NFT** - Digital asset management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- MongoDB
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SkillLink-combined
   ```

2. **Backend Setup**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd app
   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

3. **Frontend Setup**
   ```bash
   cd test
   npm install
   npm run dev
   ```

4. **Environment Variables**
   Create `.env` files in both frontend and backend directories with:
   ```
   VITE_API_BASE_URL=http://localhost:8000
   MONGODB_URL=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

## 📁 Project Structure

```
SkillLink-combined/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Database models
│   │   ├── users.py         # User management
│   │   ├── gigs.py          # Gig management
│   │   ├── applications.py  # Application handling
│   │   ├── wallet.py        # Wallet system
│   │   ├── messages.py      # Messaging system
│   │   └── ...
│   └── requirements.txt
├── test/
│   ├── src/
│   │   ├── pages/           # React components
│   │   ├── components/      # Reusable components
│   │   ├── utils/           # Utility functions
│   │   └── ...
│   └── package.json
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user

### Gigs
- `GET /gigs` - List all gigs
- `POST /gigs` - Create new gig
- `GET /gigs/{id}` - Get gig details
- `PATCH /gigs/{id}/complete` - Mark gig as completed

### Applications
- `POST /applications` - Apply to gig
- `GET /applications/player` - Get player applications
- `PATCH /applications/{id}` - Update application status
- `DELETE /applications/{id}` - Withdraw application

### Wallet
- `GET /wallet` - Get wallet information
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/deposit` - Add money to wallet
- `POST /wallet/withdraw` - Withdraw money
- `POST /wallet/payment` - Process payment

## 🎯 User Workflows

### For Organizations
1. **Register/Login** → Create organization account
2. **Add Money** → Fund wallet for gig creation
3. **Post Gig** → Create gaming opportunity with budget
4. **Review Applications** → Accept/reject player applications
5. **Complete Gig** → Mark gig as finished
6. **Payment Processing** → Automatic fund transfer to players

### For Players
1. **Register/Login** → Create player account
2. **Browse Gigs** → Find gaming opportunities
3. **Apply** → Submit application with cover letter
4. **Track Status** → Monitor application progress
5. **Complete Work** → Fulfill gig requirements
6. **Receive Payment** → Get paid through wallet system

## 🔒 Security Implementation

- **Authentication**: JWT tokens with secure storage
- **Authorization**: Role-based access control
- **Input Validation**: Comprehensive sanitization
- **Data Protection**: Encrypted sensitive information
- **Error Handling**: Safe error messages without data leakage

## 🚧 Features in Development

### Planned Enhancements
- **Real-time Messaging**: Live chat between players and organizations
- **Payment Gateway Integration**: Stripe/PayPal integration for real payments
- **Advanced Search**: Filter gigs by game, budget, skills, location
- **Rating System**: Player and organization reviews
- **Notification System**: Email/SMS alerts for status changes
- **Mobile App**: React Native mobile application
- **Analytics Dashboard**: Performance metrics and insights
- **API Documentation**: Swagger/OpenAPI documentation
- **Testing Suite**: Comprehensive unit and integration tests
- **Deployment**: Docker containerization and cloud deployment

### Current Limitations
- **Payment Processing**: Currently using dummy implementation
- **File Upload**: Limited to basic avatar uploads
- **Real-time Features**: No WebSocket implementation yet
- **Advanced Search**: Basic filtering only
- **Mobile Responsiveness**: Desktop-optimized interface

## 🤝 Contributing

We welcome contributions to **SkillLink**, a fullstack gaming gig platform built with React.js and FastAPI.

### 🛠 Tech Overview

- **Frontend**: React.js (in `/frontend`)
- **Backend**: FastAPI (in `/backend/app`)
- **Database**: MongoDB (setup scripts in `/scripts`, models in `/backend/db`)

### 📌 Contribution Workflow

1. **Fork the repository**  
   Click the “Fork” button on the top-right of this repo to create your own copy.

2. **Clone your fork locally**
   ```bash
   git clone https://github.com/<your-username>/SkillLink-combined.git
   cd SkillLink-combined

Create a new feature branch
git checkout -b feature/your-feature-name

Make your changes
💻 Frontend: Work inside /frontend

🧠 Backend: Work inside /backend/app

🧪 Tests: Add to /backend/__tests__ if needed

⚙️ Scripts: Place any database setup/migration utilities in /scripts

Commit your changes
git add .
git commit -m "feat: add your feature name"

Push to your fork
git push origin feature/your-feature-name

Open a Pull Request
Go to your fork on GitHub
Click “Compare & pull request”
Add a clear title and description
Mention any related issues if applicable

✅ Contribution Tips
Follow existing coding conventions and folder structure
Keep commits clean and descriptive
Include tests where appropriate
For large changes, open an Issue or Discussion first to align with the maintainers
We appreciate your interest in improving SkillLink!

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation for common solutions

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added wallet system and payment processing
- **v1.2.0** - Enhanced security and error handling
- **v1.3.0** - Improved UI/UX and performance optimizations

---

**Note**: This is a development version. Some features may be incomplete or subject to change. Production deployment requires additional security measures and testing. 
