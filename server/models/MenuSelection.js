const mongoose = require('mongoose');

const menuSelectionSchema = new mongoose.Schema(
  {
    menuPlanId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    studentName: { type: String, required: true, trim: true },
    studentUsername: { type: String, required: true, trim: true, lowercase: true },
    serviceDate: { type: String, required: true, index: true },
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
      index: true,
    },
    selectedOptionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    selectedOptionLabel: { type: String, required: true, trim: true },
    selectedOptionDescription: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

menuSelectionSchema.index({ menuPlanId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('MenuSelection', menuSelectionSchema);
