import mongoose from "mongoose";

const FileSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Groups",
      required: true,
    },
    fileName: { type: String, required: true },
    mediaUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true },
  { collection: "Files" }
);

const File = mongoose.model("Files", FileSchema);

export default File;
