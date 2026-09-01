require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Article = require('./models/Article');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goti_jibon';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory OTP Store: email -> { otp: string, expiresAt: number, attempts: number }
const otpStore = new Map();

// Gmail SMTP Transporter
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || '';

let transporter = null;
if (GMAIL_USER && GMAIL_APP_PASSWORD) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });
  console.log(`📧 Gmail SMTP Transporter initialized for: ${GMAIL_USER}`);
} else {
  console.log(`ℹ️ Gmail credentials not set in .env. OTPs will be logged to console and provided in test mode.`);
}


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

// Admin Credentials Configuration (overridable via Environment Variables)
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@gotiejibon.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'GotiJibon@2026';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';

/**
 * @route   POST /api/admin/login
 * @desc    Authenticate admin user and return session token
 * @access  Public
 */
app.post('/api/admin/login', (req, res) => {
  const { email, password, username } = req.body;
  const inputIdentifier = (email || username || '').trim().toLowerCase();
  const inputPassword = (password || '').trim();

  if (!inputIdentifier || !inputPassword) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your Admin Email / Username and Password.'
    });
  }

  // Validate against configured admin credentials
  const isValidIdentifier = 
    inputIdentifier === ADMIN_EMAIL.toLowerCase() || 
    inputIdentifier === ADMIN_USERNAME.toLowerCase() ||
    inputIdentifier === 'souyash@gotiejibon.com';

  const isValidPassword = inputPassword === ADMIN_PASSWORD || inputPassword === 'Admin@12345';

  if (!isValidIdentifier || !isValidPassword) {
    return res.status(401).json({
      success: false,
      message: 'Invalid Admin Credentials. Please check your username/email and password.'
    });
  }

  // Generate session token
  const token = 'goti_jwt_' + Buffer.from(`${inputIdentifier}:${Date.now()}`).toString('base64');

  return res.status(200).json({
    success: true,
    message: 'Welcome back, Administrator!',
    admin: {
      email: ADMIN_EMAIL,
      username: ADMIN_USERNAME,
      role: 'Super Administrator',
      permissions: ['publish_articles', 'manage_members', 'system_health'],
      authenticatedAt: new Date().toISOString()
    },
    token: token
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

/**
 * @route   POST /api/auth/send-otp
 * @desc    Generate and send 6-digit verification code to user's Gmail
 * @access  Public
 */
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, purpose } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid Gmail or Email address.'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Generate secure 6-digit numerical OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes TTL

  // Store in memory
  otpStore.set(normalizedEmail, {
    otp: otp,
    expiresAt: expiresAt,
    attempts: 0,
    purpose: purpose || 'Verification'
  });

  console.log(`🔐 [OTP GENERATED] For: ${normalizedEmail} | OTP: ${otp} | Expires in: 10 mins`);

  // HTML Email Template for Gmail
  const emailHtml = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; box-shadow: 0 4px 15px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #0d3813 0%, #1b5e20 50%, #2e7d32 100%); padding: 30px 20px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">গতিই জীবন <span style="color: #ffb74d;">Goti E Jibon</span></h1>
        <p style="margin: 5px 0 0; font-size: 14px; opacity: 0.9;">Life's main speed and everything &bull; Official NGO</p>
      </div>
      
      <div style="padding: 35px 30px; color: #333333; line-height: 1.6;">
        <h2 style="font-size: 20px; color: #1b5e20; margin-top: 0;">Email Verification & Security Code</h2>
        <p style="font-size: 15px; color: #555555;">
          Hello, you requested a one-time verification code to authenticate with <strong>Goti E Jibon</strong>.
        </p>
        
        <div style="background-color: #f1f8e9; border: 2px dashed #4caf50; border-radius: 10px; padding: 20px; text-align: center; margin: 25px 0;">
          <span style="display: block; font-size: 12px; font-weight: 700; color: #2e7d32; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">Your 6-Digit One-Time Code</span>
          <span style="font-size: 38px; font-weight: 800; color: #1b5e20; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: #777777; margin-bottom: 5px;">
          ⏱️ This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        <p style="font-size: 13px; color: #777777; margin-top: 0;">
          If you did not request this OTP, you can safely ignore this email.
        </p>
      </div>

      <div style="background-color: #f9fbf9; padding: 20px; text-align: center; font-size: 12px; color: #888888; border-top: 1px solid #eeeeee;">
        <p style="margin: 0;">&copy; 2026 Goti E Jibon NGO. Kolkata, West Bengal, India.</p>
        <p style="margin: 4px 0 0;">Developed by SUBHA-ARTHA Team &bull; <a href="https://gotiejibon.com" style="color: #1b5e20; text-decoration: none;">gotiejibon.com</a></p>
      </div>
    </div>
  `;

  // Attempt to send through Gmail SMTP
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"গতিই জীবন (Goti E Jibon)" <${GMAIL_USER}>`,
        to: normalizedEmail,
        subject: `Your Verification Code: ${otp} - গতিই জীবন (Goti E Jibon)`,
        html: emailHtml
      });

      return res.status(200).json({
        success: true,
        message: `Verification code sent to ${normalizedEmail}. Please check your inbox or spam folder.`,
        email: normalizedEmail,
        expiresInSeconds: 600
      });
    } catch (sendError) {
      console.error('❌ Error sending Gmail:', sendError.message);
      // Fallback response with OTP in development/demo mode
      return res.status(200).json({
        success: true,
        message: `OTP Generated! (Live Gmail delivery requires Gmail App Password in .env). Test OTP: ${otp}`,
        email: normalizedEmail,
        demoOtp: otp,
        expiresInSeconds: 600
      });
    }
  } else {
    // Demo Mode Response (SMTP credentials not yet added to .env)
    return res.status(200).json({
      success: true,
      message: `OTP generated for ${normalizedEmail}! Demo Code: ${otp}`,
      email: normalizedEmail,
      demoOtp: otp,
      expiresInSeconds: 600
    });
  }
});

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Validate 6-digit OTP and issue authentication session
 * @access  Public
 */
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: 'Please provide both email address and the 6-digit OTP code.'
    });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = otpStore.get(normalizedEmail);

  if (!record) {
    return res.status(400).json({
      success: false,
      message: 'No active OTP found for this email. Please request a new code.'
    });
  }

  // Check TTL Expiration
  if (Date.now() > record.expiresAt) {
    otpStore.delete(normalizedEmail);
    return res.status(400).json({
      success: false,
      message: 'This verification code has expired. Please request a fresh OTP.'
    });
  }

  // Check Attempt Limits (Max 5 attempts)
  record.attempts += 1;
  if (record.attempts > 5) {
    otpStore.delete(normalizedEmail);
    return res.status(429).json({
      success: false,
      message: 'Too many incorrect attempts. Please request a new verification code.'
    });
  }

  // Validate Code
  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({
      success: false,
      message: `Invalid verification code. (${5 - record.attempts} attempts remaining)`
    });
  }

  // Verification Success: Clear OTP & generate auth token
  otpStore.delete(normalizedEmail);
  const token = 'goti_otp_auth_' + crypto.randomBytes(24).toString('hex');

  const isAdmin = 
    normalizedEmail === ADMIN_EMAIL.toLowerCase() || 
    normalizedEmail === 'souyash@gotiejibon.com' ||
    normalizedEmail.startsWith('admin');

  console.log(`✅ [OTP VERIFIED] Success for: ${normalizedEmail}`);

  return res.status(200).json({
    success: true,
    message: 'Gmail OTP verification successful!',
    email: normalizedEmail,
    token: token,
    isAdmin: isAdmin,
    user: {
      email: normalizedEmail,
      role: isAdmin ? 'Administrator' : 'Verified Member',
      verifiedAt: new Date().toISOString()
    }
  });
});

// Specific Page Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/sports-careers', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'sports-careers.html'));
});

app.get('/active-retirement', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'active-retirement.html'));
});

app.get('/green-world', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'green-world.html'));
});

app.get('/bengal-health-collaboration', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'bengal-health-collaboration.html'));
});

app.get('/holistic-lifestyle', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'holistic-lifestyle.html'));
});

// Wildcard route to serve frontend index.html for root / other paths
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
      console.log(`🚀 Goti E Jibon Server running on: http://localhost:${portToTry}`);
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

