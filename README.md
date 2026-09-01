# Goti Jibon (গতি জীবন) 🌿🏃‍♂️

> *"Life's main speed and everything."*

**Goti Jibon** is a mobile-first, responsive full-stack web platform for an NGO dedicated to community wellness, sports careers, active retirement, massive tree plantation, government synergy in West Bengal, and holistic natural living.

---

## 🌟 The 5 Core Pillars

1. **Building Careers in Sports & Fitness**: Empowering youngsters to pursue athletics while guiding and supporting parents on career stability.
2. **Empowering Retired Individuals**: Inviting senior citizens to live healthy, dignified lives and lead community wellness initiatives.
3. **Turning the World Green**: Conducting mega tree plantation drives to create urban oxygen corridors and restore biodiversity.
4. **Collaborating with Government**: Partnering with administrative departments to make every district in West Bengal active and fit.
5. **Fresh Food, Exercise & Meditation**: Promoting chemical-free farm produce, daily calisthenics, pranayama, and mindfulness meditation.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5 (Semantic), CSS3 (Mobile-first, responsive grid/flexbox, custom animations), Vanilla JavaScript (ES6+ Fetch API, DOM manipulation).
- **Backend**: Node.js & Express.js REST API with CORS and JSON parsing.
- **Database**: MongoDB with Mongoose Schema modeling (with in-memory fallback for instant dev preview).

---

## 📁 Directory & File Structure

```text
goti-jibon/
├── public/
│   ├── index.html       # Main responsive layout with Hero, Founder's message, Pillars & Modals
│   ├── style.css        # Mobile-first CSS with lush green palette & animations
│   └── app.js           # Dynamic API fetching from /api/articles, modal controls, forms
├── models/
│   └── Article.js       # Mongoose Schema (title, content, author, date, category)
├── server.js            # Express server, MongoDB connection, REST API endpoints
├── .env                 # Environment configuration (PORT, MONGODB_URI)
├── .env.example         # Template for environment variables
├── package.json         # Project metadata and dependencies
└── README.md            # Documentation and execution guide
```

---

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16 or newer)
- [MongoDB](https://www.mongodb.com/) (Optional: if MongoDB is not running locally, the server provides built-in fallback mock data)

### 2. Installation
```bash
# Navigate to project directory
cd "goti ei "

# Install dependencies
npm install
```

### 3. Environment Configuration
Inspect or update `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/goti_jibon
NODE_ENV=development
```

### 4. Running the Application
```bash
# Start the Express server
npm start

# Or in development mode with auto-reload
npm run dev
```

Visit **`http://localhost:5000`** in your browser.

---

## 🔌 API Endpoints

| Method | Route | Description |
|---|---|---|
| `GET` | `/api/articles` | Fetches the latest 3 articles sorted by date descending |
| `POST` | `/api/articles` | Creates a new community article / dispatch |
| `POST` | `/api/admin/login` | Placeholder endpoint for admin authentication |
| `GET` | `/api/health` | Health check endpoint reporting server & DB status |

---

## 📱 Mobile-First Features
- **Fluid Layout**: Adapts smoothly across phones, tablets, and desktop displays.
- **Touch-Friendly Navigation**: Collapsible hamburger drawer with accessible ARIA attributes.
- **Live Feed Loader**: Shimmering skeleton loaders while fetching articles asynchronously.
- **Modal Portals**: Interactive modals for Admin Login, User Login, Membership Registration, and Gallery.

