# 🐦 Twiller — Twitter Clone

A full-stack Twitter clone built with Next.js 15, Node.js/Express, MongoDB Atlas, Firebase Auth, and Razorpay. Twiller replicates core Twitter functionality including real-time tweeting, likes, retweets, follows, notifications, and premium subscription via payments.

🌐 **Live:** [twiller-app-main.vercel.app](https://twiller-app-main.vercel.app)
💻 **GitHub:** [imashwin-max/Twiller-app](https://github.com/imashwin-max/Twiller-app)

---

## ✨ Features

- **Authentication** — Sign up / Login with Firebase Auth (Google OAuth + Email/Password)
- **Tweet Feed** — Create, view, and delete tweets with real-time updates
- **Likes & Retweets** — Interact with tweets from other users
- **Follow System** — Follow/unfollow users and get a personalized feed
- **Notifications** — Get notified when someone likes, retweets, or follows you
- **User Profiles** — View profile pages with tweet history and follower stats
- **Premium Subscription** — Upgrade to Twiller Blue via Razorpay payment gateway
- **Responsive UI** — Mobile-friendly layout matching Twitter's familiar design

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas, Mongoose |
| Auth | Firebase Authentication |
| Payments | Razorpay |
| Deployment | Vercel (frontend), Render (backend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account
- Firebase project
- Razorpay account

### 1. Clone the repository

```bash
git clone https://github.com/imashwin-max/Twiller-app.git
cd Twiller-app
```

### 2. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend
cd ../server
npm install
```

### 3. Configure environment variables

**Frontend (`client/.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Backend (`server/.env`):**
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:3000
```

### 4. Run the development server

```bash
# Start backend
cd server
npm run dev

# Start frontend (new terminal)
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
Twiller-app/
├── client/                  # Next.js frontend
│   ├── app/                 # App Router pages & layouts
│   ├── components/          # Reusable UI components
│   ├── context/             # React context (auth, etc.)
│   └── public/              # Static assets
│
└── server/                  # Express backend
    ├── controllers/         # Route handler logic
    ├── middleware/          # Auth & error middleware
    ├── models/              # Mongoose schemas
    └── routes/              # API route definitions
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | [twiller-app-main.vercel.app](https://twiller-app-main.vercel.app) |
| Backend | Render | Auto-deployed from `main` branch |
| Database | MongoDB Atlas | Cloud-hosted cluster |

### Deploy to Vercel (Frontend)

```bash
cd client
vercel --prod
```

Set all `NEXT_PUBLIC_*` environment variables in your Vercel project dashboard.

### Deploy to Render (Backend)

1. Connect your GitHub repo to Render
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add all backend environment variables in the Render dashboard

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login with JWT |
| GET | `/api/tweets` | Get all tweets |
| POST | `/api/tweets` | Create a tweet |
| DELETE | `/api/tweets/:id` | Delete a tweet |
| PUT | `/api/tweets/:id/like` | Like / unlike a tweet |
| PUT | `/api/tweets/:id/retweet` | Retweet |
| POST | `/api/users/:id/follow` | Follow / unfollow a user |
| GET | `/api/notifications` | Get notifications |
| POST | `/api/payment/order` | Create Razorpay order |
| POST | `/api/payment/verify` | Verify payment |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "feat: add my feature"`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 👨‍💻 Author

**Ashwin** — [@imashwin-max](https://github.com/imashwin-max)

Built as part of the ElevanceSkills Full Stack Development Internship.
