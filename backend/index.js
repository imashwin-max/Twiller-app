import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { UAParser } from "ua-parser-js";
import User from "./models/user.js";
import Tweet from "./models/tweet.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors({
  origin: ["https://twiller-app-main.vercel.app", "https://twiller-app-emc1.vercel.app", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

const port = process.env.PORT || 5000;
const url = process.env.MONOGDB_URL;

// Local JSON file database fallback for Demo Mode
let users = [];
let tweets = [];
const USERS_FILE = "./users.json";
const TWEETS_FILE = "./tweets.json";

const generateId = () => Math.random().toString(36).substring(2, 11) + Date.now().toString(36);

function loadMockData() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
    }
    if (fs.existsSync(TWEETS_FILE)) {
      tweets = JSON.parse(fs.readFileSync(TWEETS_FILE, "utf8"));
    }
  } catch (err) {
    console.error("⚠️ Failed to load mock data:", err.message);
  }
}

function saveMockData() {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    fs.writeFileSync(TWEETS_FILE, JSON.stringify(tweets, null, 2));
  } catch (err) {
    console.error("⚠️ Failed to save mock data:", err.message);
  }
}

if (!url) {
  console.log("⚠️ MONOGDB_URL is not defined in environment variables.");
  console.log("🚀 Starting Twiller backend in Demo/Mock Mode (using local JSON files).");
  loadMockData();
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port} (Demo Mode)`);
  });
} else {
  mongoose.connect(url)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
    })
    .catch((err) => console.error("❌ MongoDB connection error:", err.message));
}

// ─── EMAIL TRANSPORTER ───────────────────────────────────────────
let transporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Helper to send email or log OTP to console in simulation mode
async function sendEmailHelper({ to, subject, html, text }) {
  if (transporter) {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text
    });
  } else {
    console.log(`\n✉️  [SIMULATED EMAIL]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${html || text}`);
    console.log(`───────────────────────────────────────────\n`);
  }
}

// ─── IN-MEMORY OTP STORE ─────────────────────────────────────────
const otpStore = {};

// ─── EXISTING ROUTES ─────────────────────────────────────────────

app.get("/", (req, res) => res.send("Twiller backend is running successfully"));

app.post("/register", async (req, res) => {
  try {
    if (!url) {
      let existinguser = users.find(u => u.email === req.body.email);
      if (existinguser) return res.status(200).send(existinguser);
      const newUser = {
        _id: generateId(),
        username: req.body.username || "",
        displayName: req.body.displayName || "",
        avatar: req.body.avatar || "",
        email: req.body.email,
        bio: req.body.bio || "",
        location: req.body.location || "",
        website: req.body.website || "",
        phone: req.body.phone || "",
        joinedDate: new Date().toISOString(),
        notificationsEnabled: false,
        lastPasswordReset: "",
        password: req.body.password || "",
        plan: "Free",
        tweetCount: 0,
        preferredLanguage: "en",
        loginHistory: []
      };
      users.push(newUser);
      saveMockData();
      return res.status(201).send(newUser);
    }

    const existinguser = await User.findOne({ email: req.body.email });
    if (existinguser) return res.status(200).send(existinguser);
    const newUser = new User(req.body);
    await newUser.save();
    return res.status(201).send(newUser);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.get("/loggedinuser", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).send({ error: "Email required" });
    
    if (!url) {
      const user = users.find(u => u.email === email);
      return res.status(200).send(user || null);
    }

    const user = await User.findOne({ email });
    return res.status(200).send(user);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.patch("/userupdate/:email", async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!url) {
      const index = users.findIndex(u => u.email === email);
      if (index !== -1) {
        users[index] = { ...users[index], ...req.body };
        saveMockData();
        return res.status(200).send(users[index]);
      }
      return res.status(404).send({ error: "User not found" });
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: req.body },
      { new: true, upsert: false }
    );
    return res.status(200).send(updated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/post", async (req, res) => {
  try {
    const authorId = req.body.author;
    let user;
    
    if (!url) {
      user = users.find(u => u._id === authorId || u.email === authorId);
    } else {
      user = await User.findById(authorId);
    }
    
    if (!user) return res.status(404).send({ error: "User not found" });

    // Task 4 — tweet limit check
    const limits = { Free: 1, Bronze: 3, Silver: 5, Gold: Infinity };
    const limit = limits[user.plan] ?? 1;
    if (user.tweetCount >= limit) {
      return res.status(403).send({
        error: `Tweet limit reached for ${user.plan} plan. Please upgrade.`,
      });
    }

    if (!url) {
      const tweet = {
        _id: generateId(),
        ...req.body,
        likes: 0,
        retweets: 0,
        comments: 0,
        likedBy: [],
        retweetedBy: [],
        timestamp: new Date().toISOString()
      };
      tweets.push(tweet);
      
      const userIndex = users.findIndex(u => u._id === authorId || u.email === authorId);
      if (userIndex !== -1) {
        users[userIndex].tweetCount = (users[userIndex].tweetCount || 0) + 1;
      }
      saveMockData();
      return res.status(201).send(tweet);
    }

    const tweet = new Tweet(req.body);
    await tweet.save();
    await User.findByIdAndUpdate(authorId, { $inc: { tweetCount: 1 } });
    return res.status(201).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.get("/post", async (req, res) => {
  try {
    if (!url) {
      const populatedTweets = tweets.map(tweet => {
        const authorId = typeof tweet.author === 'object' ? tweet.author?._id : tweet.author;
        const authorDetails = users.find(u => u._id === authorId || u.email === authorId);
        return {
          ...tweet,
          author: authorDetails || { displayName: "Anonymous", username: "anonymous", avatar: "https://images.pexels.com/photos/1139743/pexels-photo-1139743.jpeg?auto=compress&cs=tinysrgb&w=400" }
        };
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return res.status(200).send(populatedTweets);
    }

    const tweet = await Tweet.find().sort({ timestamp: -1 }).populate("author");
    return res.status(200).send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/like/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!url) {
      const tweet = tweets.find(t => t._id === req.params.tweetid);
      if (!tweet) return res.status(404).send({ error: "Tweet not found" });
      if (!tweet.likedBy) tweet.likedBy = [];
      if (!tweet.likedBy.includes(userId)) {
        tweet.likes = (tweet.likes || 0) + 1;
        tweet.likedBy.push(userId);
        saveMockData();
      }
      return res.send(tweet);
    }

    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.likedBy.includes(userId)) {
      tweet.likes += 1;
      tweet.likedBy.push(userId);
      await tweet.save();
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/retweet/:tweetid", async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!url) {
      const tweet = tweets.find(t => t._id === req.params.tweetid);
      if (!tweet) return res.status(404).send({ error: "Tweet not found" });
      if (!tweet.retweetedBy) tweet.retweetedBy = [];
      if (!tweet.retweetedBy.includes(userId)) {
        tweet.retweets = (tweet.retweets || 0) + 1;
        tweet.retweetedBy.push(userId);
        saveMockData();
      }
      return res.send(tweet);
    }

    const tweet = await Tweet.findById(req.params.tweetid);
    if (!tweet.retweetedBy.includes(userId)) {
      tweet.retweets += 1;
      tweet.retweetedBy.push(userId);
      await tweet.save();
    }
    res.send(tweet);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── TASK 1 — Notification toggle ────────────────────────────────
app.patch("/user/notifications/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const { notificationsEnabled } = req.body;

    if (!url) {
      const index = users.findIndex(u => u.email === email);
      if (index !== -1) {
        users[index].notificationsEnabled = notificationsEnabled;
        saveMockData();
        return res.status(200).send(users[index]);
      }
      return res.status(404).send({ error: "User not found" });
    }

    const updated = await User.findOneAndUpdate(
      { email },
      { $set: { notificationsEnabled } },
      { new: true }
    );
    return res.status(200).send(updated);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── TASK 2 — Send OTP for audio tweet ───────────────────────────
app.post("/send-audio-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    
    await sendEmailHelper({
      to: email,
      subject: "Your Audio Tweet OTP - Twiller",
      html: `<h2>Your OTP is: <b>${otp}</b></h2><p>Valid for 5 minutes.</p>`,
    });

    console.log(`🎙️ [OTP SERVER LOG] Audio OTP for ${email} is: ${otp}`);
    return res.status(200).send({ message: "OTP sent successfully" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/verify-audio-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[email];
  if (!record) return res.status(400).send({ error: "No OTP found" });
  if (Date.now() > record.expires) return res.status(400).send({ error: "OTP expired" });
  if (record.otp !== otp) return res.status(400).send({ error: "Invalid OTP" });
  delete otpStore[email];
  return res.status(200).send({ message: "OTP verified" });
});

// ─── TASK 3 — Forgot Password ─────────────────────────────────────
app.post("/forgot-password", async (req, res) => {
  try {
    const { emailOrPhone, newPassword } = req.body;
    let user;

    if (!url) {
      user = users.find(u => u.email === emailOrPhone || u.phone === emailOrPhone);
    } else {
      user = await User.findOne({
        $or: [{ email: emailOrPhone }, { phone: emailOrPhone }],
      });
    }

    if (!user) return res.status(404).send({ error: "User not found" });

    const today = new Date().toISOString().split("T")[0];
    if (user.lastPasswordReset === today) {
      return res.status(429).send({
        error: "You can use this option only one time per day.",
      });
    }

    if (!url) {
      const index = users.findIndex(u => u._id === user._id);
      if (index !== -1) {
        users[index].password = newPassword;
        users[index].lastPasswordReset = today;
        saveMockData();
      }
    } else {
      await User.findByIdAndUpdate(user._id, {
        password: newPassword,
        lastPasswordReset: today,
      });
    }

    return res.status(200).send({ message: "Password updated successfully" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── TASK 4 — Razorpay Subscription ──────────────────────────────
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockkeyid12345",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mockkeysecret12345",
});

app.post("/create-order", async (req, res) => {
  try {
    // Time restriction: 10 AM to 11 AM IST
    const now = new Date();
    const istMinutes = (now.getUTCHours() * 60 + now.getUTCMinutes() + 330) % (24 * 60);
    const hourIST = Math.floor(istMinutes / 60);
    if (hourIST < 10 || hourIST >= 11) {
      return res.status(403).send({
        error: "Payments are only allowed between 10:00 AM and 11:00 AM IST.",
      });
    }

    const { amount, currency } = req.body;

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Return simulated Razorpay order
      const order = {
        id: "order_" + Math.random().toString(36).substring(2, 11),
        amount: amount * 100,
        currency: currency || "INR",
        status: "created"
      };
      return res.status(200).send(order);
    }

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: currency || "INR",
    });
    return res.status(200).send(order);
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/verify-payment", async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = req.body;

    // Check if we are running in simulation mode (no Razorpay credentials set)
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      if (!url) {
        const index = users.findIndex(u => u.email === email);
        if (index !== -1) {
          users[index].plan = plan;
          users[index].tweetCount = 0;
          saveMockData();
        }
      } else {
        await User.findOneAndUpdate({ email }, { plan, tweetCount: 0 });
      }

      const planDetails = { Bronze: "₹100/month", Silver: "₹300/month", Gold: "₹1000/month" };
      await sendEmailHelper({
        to: email,
        subject: "Twiller Subscription Invoice (Simulated)",
        html: `
          <h2>Payment Successful!</h2>
          <p>Plan: <b>${plan}</b></p>
          <p>Price: <b>${planDetails[plan]}</b></p>
          <p>Payment ID: ${razorpay_payment_id || "mock_payment_id"}</p>
          <p>Thank you for subscribing to Twiller!</p>
        `,
      });

      return res.status(200).send({ message: "Payment verified (Simulated), plan updated" });
    }

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest("hex");

    if (expectedSign !== razorpay_signature)
      return res.status(400).send({ error: "Invalid payment signature" });

    if (!url) {
      const index = users.findIndex(u => u.email === email);
      if (index !== -1) {
        users[index].plan = plan;
        users[index].tweetCount = 0;
        saveMockData();
      }
    } else {
      await User.findOneAndUpdate({ email }, { plan, tweetCount: 0 });
    }

    const planDetails = { Bronze: "₹100/month", Silver: "₹300/month", Gold: "₹1000/month" };
    await sendEmailHelper({
      to: email,
      subject: "Twiller Subscription Invoice",
      html: `
        <h2>Payment Successful!</h2>
        <p>Plan: <b>${plan}</b></p>
        <p>Price: <b>${planDetails[plan]}</b></p>
        <p>Payment ID: ${razorpay_payment_id}</p>
        <p>Thank you for subscribing to Twiller!</p>
      `,
    });
    return res.status(200).send({ message: "Payment verified, plan updated" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── TASK 5 — Language OTP ────────────────────────────────────────
app.post("/send-language-otp", async (req, res) => {
  try {
    const { email, language } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[`lang_${email}`] = { otp, expires: Date.now() + 5 * 60 * 1000 };

    if (language === "fr") {
      await sendEmailHelper({
        to: email,
        subject: "Language Change OTP - Twiller",
        html: `<h2>Your OTP: <b>${otp}</b></h2><p>Valid 5 minutes.</p>`,
      });
      console.log(`🇫🇷 [FR OTP LOG] Language change OTP for ${email}: ${otp}`);
    } else {
      // SMS simulation — log to console (replace with Twilio for real SMS)
      console.log(`📱 [SMS OTP SIMULATION] SMS OTP for ${email}: ${otp}`);
    }
    return res.status(200).send({ message: "OTP sent", otp }); // remove otp in production
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/verify-language-otp", async (req, res) => {
  const { email, otp, language } = req.body;
  const record = otpStore[`lang_${email}`];
  if (!record) return res.status(400).send({ error: "No OTP found" });
  if (Date.now() > record.expires) return res.status(400).send({ error: "OTP expired" });
  if (record.otp !== otp) return res.status(400).send({ error: "Invalid OTP" });
  delete otpStore[`lang_${email}`];
  
  if (!url) {
    const index = users.findIndex(u => u.email === email);
    if (index !== -1) {
      users[index].preferredLanguage = language;
      saveMockData();
    }
  } else {
    await User.findOneAndUpdate({ email }, { preferredLanguage: language });
  }
  
  return res.status(200).send({ message: "Language updated" });
});

// ─── TASK 6 — Login History ───────────────────────────────────────
app.post("/login-history/:email", async (req, res) => {
  try {
    const parser = new UAParser(req.headers["user-agent"]);
    const ua = parser.getResult();
    const entry = {
      browser:   ua.browser.name || "Unknown",
      os:        ua.os.name || "Unknown",
      device:    ua.device.type || "desktop",
      ip:        req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown",
      timestamp: new Date(),
    };
    
    if (!url) {
      const index = users.findIndex(u => u.email === req.params.email);
      if (index !== -1) {
        if (!users[index].loginHistory) users[index].loginHistory = [];
        users[index].loginHistory.push(entry);
        // keep slice
        if (users[index].loginHistory.length > 20) {
          users[index].loginHistory = users[index].loginHistory.slice(-20);
        }
        saveMockData();
      }
    } else {
      await User.findOneAndUpdate(
        { email: req.params.email },
        { $push: { loginHistory: { $each: [entry], $slice: -20 } } }
      );
    }
    
    return res.status(200).send({ entry });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

// ─── TASK 6 — Login OTP for Chrome ───────────────────────────────
app.post("/send-login-otp", async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[`login_${email}`] = { otp, expires: Date.now() + 5 * 60 * 1000 };
    
    await sendEmailHelper({
      to: email,
      subject: "Login Verification OTP - Twiller",
      html: `<h2>Your Login OTP: <b>${otp}</b></h2><p>Valid for 5 minutes.</p>`,
    });

    console.log(`🌐 [CHROME LOGIN OTP] Login OTP for ${email} is: ${otp}`);
    return res.status(200).send({ message: "OTP sent" });
  } catch (error) {
    return res.status(400).send({ error: error.message });
  }
});

app.post("/verify-login-otp", (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore[`login_${email}`];
  if (!record) return res.status(400).send({ error: "No OTP found" });
  if (Date.now() > record.expires) return res.status(400).send({ error: "OTP expired" });
  if (record.otp !== otp) return res.status(400).send({ error: "Invalid OTP" });
  delete otpStore[`login_${email}`];
  return res.status(200).send({ message: "Login OTP verified" });
});