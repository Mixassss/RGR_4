import { Schema, model } from "mongoose";

const userSchema = new Schema({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  }
}, {
  versionKey: false
});

export default model("User", userSchema);