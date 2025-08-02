# VERSATILE-DB

A comprehensive gaming platform database system built with **MongoDB 4** and Motor (async driver), designed for esports teams, content creators, and gaming communities.

## 🎮 Features

- **User Management**: Complete user profiles with gaming statistics
- **Game Tracking**: Multi-game support with rankings and win rates
- **Content Creation**: Highlight clips and content management
- **Gig Economy**: Job postings and applications for gaming professionals
- **Team Management**: Esports team creation and member management
- **Sponsorship**: Sponsor verification and organization management

## 🗄️ Database Schema

### MongoDB Collections

1. **users** - Main user accounts with Discord integration and wallet support
2. **profiles** - Extended user profiles with gaming stats and pentagon data
3. **games** - User game statistics and rankings
4. **highlights** - User-created content and clips
5. **gigs** - Job postings for gaming professionals
6. **applications** - Job applications and status tracking
7. **teams** - Esports team management
8. **sponsors** - Sponsor organizations and verification

### Key Features

- **UUID Primary Keys** for all documents
- **Flexible Document Structure** for gaming statistics
- **Array Data Types** for roles, badges, and tags
- **JSON Data Types** for flexible gaming statistics
- **Async MongoDB Operations** for high performance
- **MongoDB 4 Compatibility** with retry writes and reads

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- MongoDB 4.4+
- pip

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd VERSATILE-DB
   ```

2. **Set up MongoDB**
   - Install MongoDB 4.4+
   - Start MongoDB service
   - Default connection: `mongodb://localhost:27017`

3. **Run the setup script**
   ```bash
   python setup_database.py
   ```

   This will:
   - Install all dependencies
   - Check MongoDB connection
   - Create all collections
   - Seed with sample data
   - Run comprehensive tests

### Manual Setup

If you prefer manual setup:

1. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

2. **Seed data**
   ```bash
   python backend/seed_data.py
   ```

3. **Test database**
   ```bash
   python test_database.py
   ```

## 📊 Sample Data

The seed script creates:

- **15 Users** with complete profiles
- **5 Game records** (Overwatch 2, Valorant, League of Legends, CS:GO, Dota 2)
- **5 Highlights** with tags and URLs
- **5 Sponsors** (verified and unverified)
- **5 Gigs** with different payment methods
- **5 Applications** with various statuses
- **2 Teams** with multiple members

## 🧪 Testing

### Database Tests

Run comprehensive database tests:
```bash
python test_database.py
```

Tests include:
- MongoDB connection verification
- Collection document counts
- Sample data queries
- Data integrity validation
- Document structure verification

### Connection Test

Test MongoDB connection:
```bash
python backend/seed_data.py
```

## 🔧 Configuration

### Environment Variables

Set MongoDB connection in `.env`:
```bash
MONGO_URL=mongodb://localhost:27017
MONGO_DB_NAME=versatile_db
DEBUG=True
```

### Default Configuration

- **Host**: localhost
- **Port**: 27017
- **Database**: versatile_db
- **Collections**: users, profiles, games, highlights, gigs, applications, teams, sponsors

## 📁 Project Structure

```
VERSATILE-DB/
├── backend/
│   ├── database.py          # MongoDB connection and client
│   ├── mongo_models.py      # Pydantic models for MongoDB
│   ├── seed_data.py         # Sample data seeding
│   └── models/              # Legacy SQLAlchemy models (deprecated)
├── requirements.txt         # Python dependencies
├── setup_database.py        # Automated setup script
├── test_database.py         # Database testing
└── README.md               # This file
```

## 🎯 Use Cases

### For Gamers
- Track performance across multiple games
- Build gaming portfolio with highlights
- Apply for gaming gigs and opportunities
- Join or create esports teams

### For Content Creators
- Manage highlight clips and content
- Track audience engagement
- Apply for sponsored content opportunities
- Build professional gaming profile

### For Teams
- Manage team rosters and memberships
- Track team performance across games
- Coordinate with sponsors
- Organize team applications

### For Sponsors
- Post gaming-related job opportunities
- Verify sponsor status
- Manage applications and candidates
- Track sponsorship relationships

## 🔒 Data Integrity

The database includes:
- **Document Validation** with Pydantic models
- **Required Field Checks** for critical data
- **UUID Primary Keys** for security
- **Proper Indexing** for performance
- **Async Operations** for scalability

## 🚀 Performance

- **Async MongoDB Operations** for non-blocking database operations
- **Connection Pooling** for efficient resource usage
- **Optimized Queries** with proper indexing
- **MongoDB 4 Features** like retry writes and reads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the MongoDB connection settings
2. Verify all dependencies are installed
3. Run the test scripts to identify problems
4. Check the console output for error messages

## 🔄 Database Operations

### MongoDB Commands

```bash
# Connect to MongoDB
mongosh

# Switch to database
use versatile_db

# View collections
show collections

# Query users
db.users.find().limit(5)

# Query gigs
db.gigs.find({status: "open"})

# Count documents
db.users.countDocuments()
```

### Python Operations

```python
from backend.database import db
from backend.mongo_models import UserModel

# Create user
user = UserModel(email="test@example.com", username="testuser")
result = await db.users.insert_one(user.dict())

# Find user
user = await db.users.find_one({"email": "test@example.com"})

# Update user
await db.users.update_one(
    {"email": "test@example.com"}, 
    {"$set": {"username": "newusername"}}
)

# Delete user
await db.users.delete_one({"email": "test@example.com"})
```

---

**Happy Gaming with MongoDB! 🎮** 