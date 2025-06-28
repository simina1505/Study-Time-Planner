import express from "express";
import Question from "../models/Question.js";
import Quiz from "../models/Quiz.js";
import dotenv from "dotenv";

const router = express.Router();
dotenv.config();

router.post("/createQuiz", async (req, res) => {
  try {
    const { title, groupId, creatorId, questions } = req.body;
    const questionIds = [];

    for (let question of questions) {
      const createdQuestion = await Question.create({
        text: question.text,
        options: question.options,
        creator: creatorId,
      });
      questionIds.push(createdQuestion._id);
    }
    const quiz = await Quiz.create({
      title,
      groupId,
      creator: creatorId,
      questions: questionIds,
      results: [],
    });
    if (!quiz) {
      return res
        .status(400)
        .json({ success: false, message: "Quiz not created" });
    }
    res.json({ success: true, quiz });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error creating quiz" });
  }
});

router.get("/fetchGroupsQuizzes/:groupId", async (req, res) => {
  try {
    const { groupId } = req.params;
    const query = { groupId: groupId };
    const quizzes = await Quiz.find(query).populate("questions");

    if (!quizzes.length) {
      return res.status(200).json([]);
    }
    res.status(200).json({ success: true, quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/getQuiz/:quizId", async (req, res) => {
  const { quizId } = req.params;

  try {
    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    res.status(200).json({ quiz });
  } catch (error) {
    res.status(500).json({ message: "Error fetching quiz", error });
  }
});

router.post("/createRandomTest", async (req, res) => {
  const { groupId, loggedUserId } = req.body;

  try {
    const quizzes = await Quiz.find({ groupId });

    let allQuestions = quizzes.flatMap((quiz) => quiz.questions);
    allQuestions = allQuestions.sort(() => Math.random() - 0.5).slice(0, 10);

    const testTitle = `Test-${Date.now()}`;
    const newTest = await Quiz.create({
      title: testTitle,
      groupId,
      creator: loggedUserId,
      questions: allQuestions,
      results: [],
      createdAt: new Date(),
    });

    res.status(201).json({ test: newTest });
  } catch (error) {
    res.status(400).json({ message: "Error creating random test", error });
  }
});

router.post("/submitQuiz/:quizId", async (req, res) => {
  const { quizId } = req.params;
  const { userId, score } = req.body;

  try {
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    const existingResultIndex = quiz.results.findIndex(
      (result) => result.userId.toString() === userId
    );

    if (existingResultIndex !== -1) {
      quiz.results[existingResultIndex].score = score;
      quiz.results[existingResultIndex].submittedAt = new Date();
    } else {
      quiz.results.push({
        userId,
        score,
        submittedAt: new Date(),
      });
    }

    await quiz.save();

    res.status(200).json({ message: "Score submitted", results: quiz.results });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error submitting score", error: err.message });
  }
});

router.delete("/deleteQuiz/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;

    const quiz = await Quiz.findById(quizId).populate("questions");
    if (!quiz) {
      return res
        .status(404)
        .json({ success: false, message: "Quiz not found" });
    }

    const isRandomTest = quiz.title.startsWith("Test-");
    if (!isRandomTest) {
      await Question.deleteMany({ _id: { $in: quiz.questions } });
    }

    await Quiz.findByIdAndDelete(quizId);

    res.json({
      success: true,
      message: isRandomTest
        ? "Random test deleted successfully"
        : "Quiz and its questions deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting quiz" });
  }
});

router.delete("/deleteQuestion/:questionId", async (req, res) => {
  try {
    const { questionId } = req.params;

    const question = await Question.findById(questionId);
    if (!question) {
      return res
        .status(404)
        .json({ success: false, message: "Question not found" });
    }

    await Question.findByIdAndDelete(questionId);

    res.json({ success: true, message: "Question deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error deleting question" });
  }
});
export default router;
