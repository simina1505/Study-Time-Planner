import mongoose from "mongoose";
const questionSchema = new mongoose.Schema(
  {
    text: String,
    options: [
      {
        text: { type: String, required: true },
        isCorrect: { type: Boolean, default: false },
      },
    ],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
  },
  {
    collection: "Questions",
  }
);

const Question = mongoose.model("Questions", questionSchema);
export default Question;
