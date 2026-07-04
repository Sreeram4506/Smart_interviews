const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [4, 'Password must be at least 4 characters'],
    },
    role: {
      type: String,
      enum: ['student', 'mess_owner'],
      required: [true, 'Role is required'],
    },
    name: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  if (this.password.startsWith('$2')) return;

  const hashedPassword = await bcrypt.hash(this.password, 12);
  this.password = hashedPassword;
});

// Compare password helper
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;

  if (this.password.startsWith('$2')) {
    return bcrypt.compare(candidatePassword, this.password);
  }

  return candidatePassword === this.password;
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
