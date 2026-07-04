const mongoose = require('mongoose');

const menuSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    ownerRole: { type: String, required: true, enum: ['mess_owner'] },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '', trim: true },
    category: { type: String, default: '', trim: true },
    quantity: { type: String, default: '', trim: true }, // keep flexible for demo
    imageDataUrl: { type: String, default: null }, // optional (DataURL)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Menu', menuSchema);
