import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a challenge title'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a challenge description'],
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Web', 'Pwn', 'Reverse', 'Crypto', 'Forensics', 'Misc'],
  },
  difficulty: {
    type: String,
    required: [true, 'Please provide a difficulty level'],
    enum: ['Easy', 'Medium', 'Hard', 'Insane'],
  },
  points: {
    type: Number,
    required: [true, 'Please provide points value'],
    min: 0,
  },
  flag: {
    type: String,
    required: [true, 'Please provide a flag'],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  solvedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    solvedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  files: [{
    name: String,
    url: String,
  }],
  hints: [{
    content: String,
    cost: Number,
  }],
  isActive: {
    type: Boolean,
    default: true,
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

// Update the updatedAt timestamp before saving
challengeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Challenge = mongoose.models?.Challenge || mongoose.model('Challenge', challengeSchema);

export default Challenge;
