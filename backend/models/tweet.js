import mongoose from "mongoose";

const TweetSchema = mongoose.Schema({
  author:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  content:     { type: String, default: "" },
  likes:       { type: Number, default: 0 },
  retweets:    { type: Number, default: 0 },
  comments:    { type: Number, default: 0 },
  likedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  retweetedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  image:       { type: String, default: null },
  timestamp:   { type: Date, default: Date.now() },

  // Task 2 — Audio Tweet
  audioUrl:    { type: String, default: null },
  tweetType:   { type: String, default: "text" }, // "text" | "audio"
});

export default mongoose.model("Tweet", TweetSchema);
