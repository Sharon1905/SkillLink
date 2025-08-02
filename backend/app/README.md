🎮 SkillLink - Esports Talent Matchmaking Platform

SkillLink is a full-stack platform that connects **esports players** with **gaming organizations** for short-term gigs, endorsements, and long-term recognition. Think of it as **LinkedIn meets Soulbound NFTs** for competitive gamers.

---

🚀 Features

👤 For Players
- Register & login securely
- Browse and apply to gaming gigs
- Receive endorsements from organizations
- Mint Soulbound NFTs based on reputation

🏢 For Organizations
- Register & login securely
- Post, update, and delete gigs
- View applicants and endorse players
- Analyze platform metrics with built-in admin analytics

💎 Soulbound NFTs
- Non-transferable NFTs are minted as proof of player credibility once endorsed
- Simulated minting with metadata including timestamp and reputation


⚙️ Tech Stack

- **Backend:** FastAPI (Python)
- **Database:** MongoDB
- **Authentication:** JWT Token-based (OAuth2 scheme)
- **Password Hashing:** Passlib (bcrypt)
- **Deployment-ready:** ASGI (Uvicorn), modular file structure


🧩 Folder Structure

SkillLink/
│
├── Backend/
│   ├── main.py                # FastAPI app entrypoint
│   ├── auth.py                # Auth system (JWT, OAuth2, hashing)
│   ├── database.py            # MongoDB connection
│   ├── users.py               # Register, login, profile routes
│   ├── gigs.py                # Gig creation, update, browse
│   ├── applications.py        # Apply to gigs
│   ├── endorsements.py        # Endorse players
│   ├── nft.py                 # Mint & fetch soulbound NFTs
│   ├── admin.py               # Admin analytics
│   ├── models.py              # Helpers for formatting DB output
│   ├── schemas.py             # Pydantic validation models
│   └── requirements.txt       # Python dependencies

🧪 How to Run Locally

1. Clone the repo

git clone https://github.com/yourusername/skilllink.git
cd skilllink/Backend

2. Create virtual environment

python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

3. Install dependencies

pip install -r requirements.txt

4. Start MongoDB

Make sure your MongoDB service is running locally on the default port (`27017`).

5. Start the FastAPI server

uvicorn main:app --reload

Visit [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs) to test the API using the built-in Swagger UI.

📌 Sample API Routes

| Method | Route                     | Description                    |
| ------ | ------------------------- | ------------------------------ |
| POST   | `/register`               | Register new player/org        |
| POST   | `/login`                  | Login and receive JWT token    |
| GET    | `/gigs`                   | Browse gigs                    |
| POST   | `/gigs`                   | Post new gig (org only)        |
| POST   | `/apply`                  | Apply to a gig (player only)   |
| GET    | `/endorsements/{user_id}` | View endorsements for a player |
| POST   | `/endorse`                | Endorse a player (org only)    |
| POST   | `/mint_soulbound_nft`     | Mint soulbound NFT for player  |
| GET    | `/admin/stats`            | View system analytics          |



🛠️ Future Enhancements

* NFT metadata pinning to IPFS (real-world decentralized minting)
* Chat & messaging between players and orgs
* Real-time application notifications
* OAuth signup (Discord, Twitch)
* Leaderboards for top players/orgs

👥 Team

* Sharon Shaji (Backend Lead)
* Mithun Chakladar (Frontend Dev)
* Aditya Rawat(Frontend Dev)
* Aman Pandit (Data and Storage architect)

---

📄 License

This project is open source and available under the [MIT License](LICENSE).


> SkillLink is more than just a gig board — it’s a **reputation layer** for esports careers. 🎯


