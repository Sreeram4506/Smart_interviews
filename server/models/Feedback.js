const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentUsername: { type: String, required: true, trim: true, lowercase: true },
    menuItemId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    menuItemName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    description: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
