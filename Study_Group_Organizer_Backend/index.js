import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import serviceAccount from "./studygrouporganizer-firebase-adminsdk-fbsvc-6680a518ef.json" assert { type: "json" };
import admin from "firebase-admin";
import NodeGeocoder from "node-geocoder";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import groupRoutes from "./routes/groups.js";
import sessionRoutes from "./routes/sessions.js";
import messageRoutes from "./routes/messagesAndFiles.js";
import taskRoutes from "./routes/tasks.js";
import quizRoutes from "./routes/quizzes.js";
import profileRoutes from "./routes/profile.js";
import Message from "./models/Message.js";
import User from "./models/User.js";
import File from "./models/Files.js";

const app = express();
dotenv.config();

const PORT = process.env.PORT;
const MONGOURL = process.env.MONGODB_URL;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

mongoose
  .connect(MONGOURL)
  .then(() => {
    console.log("Database is connected successfully.");
    httpServer.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const geocoder = NodeGeocoder({
  provider: "openstreetmap",
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ status: "Started" });
});
app.io = io;
app.use("/", authRoutes);
app.use("/", userRoutes);
app.use("/", groupRoutes);
app.use("/", sessionRoutes);
app.use("/", messageRoutes);
app.use("/", taskRoutes);
app.use("/", quizRoutes);
app.use("/", profileRoutes);

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join_group", async (data) => {
    const { groupId, userId } = data;
    socket.join(groupId);

    socket.to(groupId).emit("user_joined", {
      userId,
      timestamp: new Date(),
    });

    console.log(`Socket ${socket.id} (User ${userId}) joined group ${groupId}`);
  });

  socket.on("leave_group", (groupId) => {
    socket.leave(groupId);
    console.log(`Socket ${socket.id} left group ${groupId}`);
  });

  socket.on("send_file", async (fileData) => {
    try {
      const { senderId, groupId, fileName, mediaUrl, username, messageId } =
        fileData;

      const user = await User.findById(senderId);
      const formattedFileMessage = {
        _id: messageId || new mongoose.Types.ObjectId().toString(),
        text: `File: ${fileName}`,
        timestamp: new Date(),
        user: {
          _id: senderId,
          name: user ? user.username : username || "Unknown User",
        },
        file: {
          url: mediaUrl,
          name: fileName,
        },
      };

      io.to(groupId).emit("receive_message", formattedFileMessage);
    } catch (error) {
      console.error("Error sending file via socket:", error);
      socket.emit("error", { message: "Failed to send file in real-time" });
    }
  });

  socket.on("send_message", async (messageData) => {
    try {
      const { senderId, groupId, content, timestamp, messageId } = messageData;

      const user = await User.findById(senderId);

      const formattedMessage = {
        _id: messageId,
        text: content,
        timestamp: timestamp,
        user: {
          _id: senderId,
          name: user ? user.username : "Unknown User",
        },
        file: null,
      };
      io.to(groupId).emit("receive_message", formattedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("error", { message: "Failed to send message" });
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected:", socket.id);
  });
});
