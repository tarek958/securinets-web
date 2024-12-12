import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a team name'],
    unique: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  leader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  solvedChallenges: [{
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    solvedAt: {
      type: Date,
      default: Date.now
    },
    points: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to enforce maximum 4 members
teamSchema.pre('save', function(next) {
  if (this.members.length > 4) {
    next(new Error('Team cannot have more than 4 members'));
  } else {
    next();
  }
});

// Method to check if team can add more members
teamSchema.methods.canAddMember = function() {
  return this.members.length < 4;
};

// Method to get remaining slots
teamSchema.methods.getRemainingSlots = function() {
  return 4 - this.members.length;
};

const Team = mongoose.models?.Team || mongoose.model('Team', teamSchema);

export default Team;
