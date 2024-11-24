import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxLength: [200, 'Title cannot be more than 200 characters'],
  },
  content: {
    type: String,
    required: [true, 'Please provide content'],
  },
  images: [{
    url: String,
    publicId: String, // For Cloudinary
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  comments: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    parentComment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  isEdited: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update timestamps
postSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Post = mongoose.models?.Post || mongoose.model('Post', postSchema);

export default Post;
