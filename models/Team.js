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
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  inviteCode: {
    type: String,
    unique: true,
    sparse: true
  }
});

// Generate random invite code for non-public teams
teamSchema.pre('save', async function(next) {
  if (!this.isPublic && !this.inviteCode) {
    // Generate a random 8-character code
    const generateCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      return Array.from(
        { length: 8 },
        () => chars.charAt(Math.floor(Math.random() * chars.length))
      ).join('');
    };

    // Keep generating until we find a unique code
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = generateCode();
      const existingTeam = await mongoose.models.Team.findOne({ inviteCode: code });
      if (!existingTeam) {
        isUnique = true;
      }
    }
    this.inviteCode = code;
  }
  next();
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
