require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goti_jibon';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory fallback articles for initial demonstration if database is empty/offline
const fallbackArticles = [
  {
    _id: 'seed-1',
    title: 'Transforming Bengal: Sports Camps & Parental Awareness',
    content: 'Our latest community outreach in rural and urban Bengal is fostering grassroot athletics while counseling parents on sustainable sports careers for their children.',
    author: 'Goti Jibon Sports Cell',
    category: 'Sports & Youth',
    readTime: '4 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1) // 1 day ago
  },
  {
    _id: 'seed-2',
    title: 'The Green Horizon: 50,000 Saplings Planted This Monsoon',
    content: 'Together with thousands of volunteers, school students, and local authorities, we have successfully planted over 50,000 native trees across West Bengal districts.',
    author: 'Environment Wing',
    category: 'Green Earth',
    readTime: '3 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
  },
  {
    _id: 'seed-3',
    title: 'Active Golden Years: Retirees Leading Daily Wellness Circles',
    content: 'Retired professionals and senior citizens are rediscovering energy through our morning yoga, meditation, and community mentorship initiatives.',
    author: 'Wellness & Elders Forum',
    category: 'Active Aging',
    readTime: '5 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) // 5 days ago
  }
];

// MongoDB Connection State Tracking
let isMongoConnected = false;

// Connect to MongoDB
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
    
    // Auto-seed sample articles if database is empty
    try {
      const count = await Article.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding initial articles into MongoDB...');
        await Article.insertMany(fallbackArticles.map(({ _id, ...rest }) => rest));
        console.log('✅ Initial articles seeded.');
      }
    } catch (seedErr) {
      console.warn('⚠️ Seeding note:', seedErr.message);
    }
  })
  .catch((err) => {
    isMongoConnected = false;
    console.warn(`⚠️ MongoDB connection warning: ${err.message}`);
    console.log('ℹ️ Server will operate with fallback sample data for immediate frontend preview.');
  });

// API Routes

/**
 * @route   GET /api/articles
 * @desc    Fetch the latest 3 articles from database
 * @access  Public
 */
app.get('/api/articles', async (req, res) => {
  try {
    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const articles = await Article.find()
        .sort({ date: -1 })
        .limit(3)
        .lean();

      if (articles && articles.length > 0) {
        return res.status(200).json({
          success: true,
          source: 'database',
          count: articles.length,
          data: articles
        });
      }
    }

    // Fallback if DB is empty or disconnected
    return res.status(200).json({
      success: true,
      source: 'fallback',
      count: fallbackArticles.length,
      data: fallbackArticles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve articles',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/articles
 * @desc    Create a new article
 * @access  Public / Admin
 */
app.post('/api/articles', async (req, res) => {
  try {
    const { title, content, author, category, readTime } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required fields.'
      });
    }

    if (isMongoConnected && mongoose.connection.readyState === 1) {
      const newArticle = new Article({
        title,
        content,
        author: author || 'Goti Jibon Team',
        category: category || 'General Update',
        readTime: readTime || '3 min read',
        date: new Date()
      });

      const savedArticle = await newArticle.save();
      return res.status(201).json({
        success: true,
        message: 'Article published successfully',
        data: savedArticle
      });
    }

    // Fallback if DB is not connected
    const fallbackItem = {
      _id: 'temp-' + Date.now(),
      title,
      content,
      author: author || 'Goti Jibon Team',
      category: category || 'General Update',
      readTime: readTime || '3 min read',
      date: new Date()
    };
    fallbackArticles.unshift(fallbackItem);

    return res.status(201).json({
      success: true,
      message: 'Article published (in-memory mode)',
      data: fallbackItem
    });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish article',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/admin/login
 * @desc    Placeholder route for future admin authentication
 * @access  Public
 */
app.post('/api/admin/login', (req, res) => {
  const { email, password, username } = req.body;

  // Placeholder authentication logic
  const adminIdentifier = email || username;

  if (!adminIdentifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both admin username/email and password.'
    });
  }

  // Demonstration credential validation placeholder
  // In production, this will compare bcrypt hashes and issue a signed JWT
  return res.status(200).json({
    success: true,
    message: 'Admin authentication endpoint ready for production integration.',
    admin: {
      user: adminIdentifier,
      role: 'Administrator',
      status: 'Authenticated (Placeholder Session)'
    },
    token: 'jwt_placeholder_token_goti_jibon_' + Buffer.from(adminIdentifier).toString('base64'),
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    app: 'Goti Jibon Backend API',
    database: isMongoConnected ? 'connected' : 'fallback/offline',
    timestamp: new Date().toISOString()
  });
});

// Wildcard route to serve frontend index.html for SPA/Direct navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server with Automatic Port Conflict Resolution
function startServer(initialPort, maxAttempts = 10) {
  let currentPort = Number(initialPort);
  let attempts = 0;

  function tryListen(portToTry) {
    const serverInstance = app.listen(portToTry, () => {
      console.log(`=============================================`);
      console.log(`🚀 Goti Jibon Server running on: http://localhost:${portToTry}`);
      console.log(`🌿 Life's main speed and everything.`);
      console.log(`📁 Static files served from: ${path.join(__dirname, 'public')}`);
      console.log(`=============================================`);
    });

    serverInstance.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        attempts++;
        console.warn(`⚠️ Port ${portToTry} is already in use (common on macOS due to AirPlay Receiver).`);
        if (attempts < maxAttempts) {
          const nextPort = portToTry + 1;
          console.log(`🔄 Automatically switching to port ${nextPort}...`);
          tryListen(nextPort);
        } else {
          console.error(`❌ Could not find an available port after ${maxAttempts} attempts.`);
        }
      } else {
        console.error('Server error:', err);
      }
    });
  }

  tryListen(currentPort);
}

startServer(PORT);

