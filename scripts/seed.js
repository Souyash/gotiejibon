require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../models/Article');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/goti_jibon';

const initialArticles = [
  {
    title: 'Transforming Bengal: Sports Camps & Parental Awareness',
    content: 'Our latest community outreach in rural and urban Bengal is fostering grassroot athletics while counseling parents on sustainable sports careers for their children.',
    author: 'Goti Jibon Sports Cell',
    category: 'Sports & Youth',
    readTime: '4 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1)
  },
  {
    title: 'The Green Horizon: 50,000 Saplings Planted This Monsoon',
    content: 'Together with thousands of volunteers, school students, and local authorities, we have successfully planted over 50,000 native trees across West Bengal districts.',
    author: 'Environment Wing',
    category: 'Green Earth',
    readTime: '3 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3)
  },
  {
    title: 'Active Golden Years: Retirees Leading Daily Wellness Circles',
    content: 'Retired professionals and senior citizens are rediscovering energy through our morning yoga, meditation, and community mentorship initiatives.',
    author: 'Wellness & Elders Forum',
    category: 'Active Aging',
    readTime: '5 min read',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('Clearing existing articles...');
    await Article.deleteMany({});

    console.log('Inserting initial articles...');
    const inserted = await Article.insertMany(initialArticles);
    console.log(`✅ Successfully seeded ${inserted.length} articles.`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seedDatabase();

