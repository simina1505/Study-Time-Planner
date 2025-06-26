import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    title: String,
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Groups" },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Questions" }],
    results: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
        score: Number,
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    createdAt: { type: Date, default: Date.now },
  },
  {
    collection: "Quizzes",
  }
);

const Quiz = mongoose.model("Quizzes", quizSchema);
export default Quiz;
