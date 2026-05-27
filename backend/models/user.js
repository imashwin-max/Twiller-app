import mongoose from "mongoose";

const UserSchema = mongoose.Schema({
  username:             { type: String, required: true },
  displayName:          { type: String, required: true },
  avatar:               { type: String, required: true },
  email:                { type: String, required: true, unique: true },
  bio:                  { type: String, default: "" },
  location:             { type: String, default: "" },
  website:              { type: String, default: "" },
  joinedDate:           { type: Date, default: Date.now() },
  phone:                { type: String, default: "" },

  // Task 1 — Notifications
  notificationsEnabled: { type: Boolean, default: false },

  // Task 3 — Forgot Password
  lastPasswordReset:    { type: String, default: "" },
  password:             { type: String, default: "" },

  // Task 4 — Subscription
  plan:                 { type: String, default: "Free" },
  tweetCount:           { type: Number, default: 0 },

  // Task 5 — Language
  preferredLanguage:    { type: String, default: "en" },

  // Task 6 — Login History
  loginHistory: [
    {
      browser:   { type: String },
      os:        { type: String },
      device:    { type: String },
      ip:        { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("User", UserSchema);
