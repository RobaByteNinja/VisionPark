const mongoose = require("mongoose");

const SPOT_STATES = ["free", "reserved", "occupied", "blocked"];

const parkingSpotSchema = new mongoose.Schema(
  {
    lotId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "ParkingLot",
    },
    zoneId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
      ref: "ParkingZone",
    },
    code: { type: String, required: true, trim: true },
    category: { type: String, trim: true, default: null },
    isBlocked: { type: Boolean, default: false, index: true },
    status: {
      type: String,
      enum: SPOT_STATES,
      required: true,
      default: "free",
      index: true,
    },
    derivedFromSessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ParkingSession",
      default: null,
    },
    statusDerivedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: "__v",
  }
);

parkingSpotSchema.index(
  { lotId: 1, zoneId: 1, code: 1 },
  { unique: true, name: "uniq_spot_code_within_zone" }
);

const ParkingSpot = mongoose.model("ParkingSpot", parkingSpotSchema);

module.exports = {
  ParkingSpot,
  SPOT_STATES,
};
