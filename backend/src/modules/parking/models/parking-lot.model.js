const mongoose = require("mongoose");

const parkingLotSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "User",
    },
    name: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

parkingLotSchema.index({ ownerId: 1, name: 1 }, { unique: true, name: "uniq_owner_lot_name" });

const ParkingLot = mongoose.model("ParkingLot", parkingLotSchema);

module.exports = { ParkingLot };
