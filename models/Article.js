const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Article content is required']
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      default: 'Goti Jibon Team',
      trim: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      default: 'Community & Health',
      trim: true
    },
    readTime: {
      type: String,
      default: '3 min read'
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient sorting by latest articles
articleSchema.index({ date: -1 });

module.exports = mongoose.model('Article', articleSchema);
