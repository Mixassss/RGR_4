import { Schema, model } from "mongoose";

const relaySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  configuration: {
    tripTime: { 
      type: Number,
      min: 0,
      required: true,
    },
    mode: { 
      type: String, 
      enum: ["auto", "manual"], 
      required: true 
    },
    voltageLevel: { 
      type: Number,
      min: 0,
      required: true
    },
    currentThreshold: { 
      type: Number,
      min: 0,
      required: true 
    },
    sensitivity: { 
      type: Number,
      min: 0,
      required: true
    },
    delay: {
      type: Number,
      min: 0,
      required: true
    }
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  reportFilePath: {
    type: String,
    default: ""
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  versionKey: false // Убираем поле __v
});

// Добавляем индексы для быстрого поиска
relaySchema.index({ name: 1 });
relaySchema.index({ "uploadedBy": 1 });
relaySchema.index({ "createdAt": -1 });

export default model("Relay", relaySchema);