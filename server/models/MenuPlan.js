const mongoose = require('mongoose');

const menuOptionSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    imageDataUrl: { type: String, default: null },
  },
  { _id: true }
);

const menuPlanSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerRole: { type: String, required: true, enum: ['mess_owner'] },
    serviceDate: { type: String, required: true, index: true }, // YYYY-MM-DD
    mealType: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'snacks', 'dinner'],
      index: true,
    },
    title: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    options: { type: [menuOptionSchema], default: [] },
  },
  { timestamps: true }
);

menuPlanSchema.index({ serviceDate: 1, mealType: 1 }, { unique: false });

module.exports = mongoose.model('MenuPlan', menuPlanSchema);
