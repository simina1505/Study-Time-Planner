import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import CustomButton from "../../../components/CustomButton";
import FormField from "../../../components/FormField";
import axios from "axios";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../../constants/config";

const QuizPage = () => {
  const { groupId } = useLocalSearchParams();
  const [quizzes, setQuizzes] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [quiz, setQuiz] = useState({ title: "" });
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [addedQuestions, setAddedQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answerOption, setAnswerOption] = useState("");
  const [currentAnswers, setCurrentAnswers] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await getLoggedUser();
        await fetchQuizzes();
      };
      fetchData();
    }, [groupId])
  );

  const getLoggedUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("loggedUserId");
      if (userId) {
        setLoggedUserId(userId);
      }
    } catch (error) {
      console.error("Error retrieving loggedUserId:", error);
    }
  };

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchGroupsQuizzes/${groupId}`
      );
      setQuizzes(response.data.quizzes);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchQuizById = async (quizId) => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/getQuiz/${quizId}`
      );
      setCurrentQuiz(response.data.quiz);
      setUserAnswers({});
      setQuizModalVisible(true);
      setIsSubmitted(false);
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  const createQuiz = async () => {
    if (addedQuestions.length === 0) {
      console.error("No questions added to the quiz");
      return;
    }
    const isValidQuestion = (q) =>
      q &&
      typeof q.text === "string" &&
      Array.isArray(q.options) &&
      q.options.length > 0 &&
      q.options.every(
        (opt) =>
          opt &&
          typeof opt.text === "string" &&
          typeof opt.isCorrect === "boolean"
      );

    const validQuestions = addedQuestions.filter(isValidQuestion);

    if (validQuestions.length === 0) {
      console.error("No valid questions to send");
      return;
    }
    try {
      const response = await axios.post(`${config.SERVER_URL}/createQuiz`, {
        title: quiz.title,
        groupId,
        creatorId: loggedUserId,
        questions: addedQuestions,
      });
      const newQuiz = response.data.quiz;
      if (!quizzes) {
        setQuizzes([newQuiz]);
      } else setQuizzes([...quizzes, newQuiz]);

      setModalVisible(false);
      setQuiz({ title: "" });
      setCurrentQuestion("");
      setCurrentAnswers([]);
      setAddedQuestions([]);
    } catch (error) {
      console.error("Error creating quiz:", error);
    }
  };

  const createRandomTest = async () => {
    try {
      const response = await axios.post(
        `${config.SERVER_URL}/createRandomTest`,
        { groupId, loggedUserId }
      );
      setQuizzes([...quizzes, response.data.test]);
    } catch (error) {
      console.error("Error creating random test:", error);
    }
  };

  const deleteQuiz = async (quizId) => {
    Alert.alert("Delete Quiz", "Are you sure you want to delete the quiz?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.delete(`${config.SERVER_URL}/deleteQuiz/${quizId}`);
            Alert.alert("Success", "Quiz deleted successfully.");
            setQuizzes(quizzes.filter((q) => q._id !== quizId));
          } catch (error) {
            console.error("Error deleting quiz:", error);
          }
        },
      },
    ]);
  };

  const addAnswerOption = () => {
    if (answerOption.trim() !== "") {
      const newAnswer = {
        text: answerOption,
        isCorrect: false,
      };
      setCurrentAnswers([...currentAnswers, newAnswer]);
      setAnswerOption("");
    }
  };

  const toggleCorrect = (index) => {
    const updatedAnswers = currentAnswers.map((ans, i) => {
      if (i === index) {
        return { ...ans, isCorrect: !ans.isCorrect };
      }
      return ans;
    });
    setCurrentAnswers(updatedAnswers);
  };

  const submitQuestion = () => {
    if (currentQuestion.trim() !== "") {
      const newQuestion = {
        text: currentQuestion,
        options: currentAnswers,
      };
      setAddedQuestions([...addedQuestions, newQuestion]);
      setCurrentQuestion("");
      setCurrentAnswers([]);
    }
  };

  const handleSubmitQuiz = async () => {
    let score = 0;
    const totalQuestions = currentQuiz.questions.length;

    currentQuiz.questions.forEach((q, idx) => {
      const correctAnswers = q.options
        .filter((opt) => opt.isCorrect)
        .map((opt) => opt.text);
      const selectedAnswers = userAnswers[idx] || [];
      const isCorrect =
        correctAnswers.length === selectedAnswers.length &&
        correctAnswers.every((ans) => selectedAnswers.includes(ans));
      if (isCorrect) score++;
    });

    const percentageScore = ((score / totalQuestions) * 100).toFixed(2);
    try {
      await axios.post(`${config.SERVER_URL}/submitQuiz/${currentQuiz._id}`, {
        userId: loggedUserId,
        score: percentageScore,
      });
      await fetchQuizzes();
      setIsSubmitted(true);
    } catch (error) {
      console.error("Error saving quiz score:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-row justify-between">
        <CustomButton
          title="New Quiz"
          handlePress={() => setModalVisible(true)}
          containerStyles="m-2 w-40"
          textStyles="text-white px-2 p-2"
        />
        <CustomButton
          title="Create Random Quiz"
          handlePress={createRandomTest}
          containerStyles="m-2 w-40"
          textStyles="text-white px-2 p-2"
        />
      </View>
      <View style={styles.container}>
        {quizzes?.length === 0 || !quizzes ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 18, color: "#888" }}>Add new quiz</Text>
          </View>
        ) : (
          <FlatList
            data={quizzes}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => fetchQuizById(item._id)}>
                <View style={styles.quizCard}>
                  <Text style={styles.quizTitle}>{item.title}</Text>
                  {item.results &&
                    item.results.find(
                      (result) => result.userId === loggedUserId
                    ) && (
                      <Text style={styles.quizType}>
                        Score:{" "}
                        {
                          item.results.find(
                            (result) => result.userId === loggedUserId
                          )?.score
                        }
                        %
                      </Text>
                    )}

                  {item.creator === loggedUserId && (
                    <TouchableOpacity onPress={() => deleteQuiz(item._id)}>
                      <FontAwesome name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 16,
                  }}>
                  Create Quiz
                </Text>
                <FormField
                  title="Quiz Title"
                  value={quiz.title}
                  handleChangeText={(text) => setQuiz({ ...quiz, title: text })}
                  otherStyles="mx-6"
                  placeholder="Enter quiz title"
                />
                <FormField
                  title="Question"
                  value={currentQuestion}
                  handleChangeText={setCurrentQuestion}
                  otherStyles="mx-6"
                  placeholder="Enter question"
                />
                <View className="flex-row">
                  <FormField
                    title="Answer Options"
                    value={answerOption}
                    handleChangeText={setAnswerOption}
                    otherStyles="mx-6"
                    placeholder="Enter answer option"
                  />
                  <View className="pt-6">
                    <CustomButton
                      title="Add Answer"
                      handlePress={addAnswerOption}
                      textStyles="text-white px-2 p-2"
                      containerStyles=" mt-7 w-40"
                    />
                  </View>
                </View>
                {currentAnswers.length > 0 && (
                  <Text
                    className="mx-6 pt-4"
                    style={{
                      color: "grey",
                    }}>
                    Mark correct answers
                  </Text>
                )}

                {currentAnswers?.map((ans, index) => (
                  <View
                    key={index}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: 8,
                      backgroundColor: ans.isCorrect ? "#a5d6a7" : "#e0e0e0",
                      marginVertical: 4,
                      borderRadius: 4,
                      width: "85%",
                      alignSelf: "center",
                    }}>
                    <TouchableOpacity
                      onPress={() => toggleCorrect(index)}
                      style={{ flex: 1, alignItems: "center" }}>
                      <Text>{ans.text}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        const updatedAnswers = currentAnswers.filter(
                          (_, i) => i !== index
                        );
                        setCurrentAnswers(updatedAnswers);
                      }}>
                      <FontAwesome name="trash" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                ))}
                <CustomButton
                  title="Submit Question"
                  handlePress={submitQuestion}
                  textStyles="text-white px-2 p-2"
                  containerStyles="mb-3 m-1 mt-6"
                />

                <FlatList
                  data={addedQuestions}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View className="flex-row m-6">
                      <View className="pr-2">
                        <Text style={{ fontWeight: "bold" }}>
                          Q: {item.text}
                        </Text>
                        {item.options.map((a, i) => (
                          <Text
                            key={i}
                            style={{
                              color: a.isCorrect ? "green" : "gray",
                            }}>
                            - {a.text}
                          </Text>
                        ))}
                      </View>
                      <TouchableOpacity
                        onPress={() => {
                          const updatedQuestions = addedQuestions.filter(
                            (_, i) => i !== index
                          );
                          setAddedQuestions(updatedQuestions);
                        }}>
                        <FontAwesome name="trash" size={20} color="red" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
                <View className="flex-row justify-around">
                  <CustomButton
                    title="Finish Quiz"
                    handlePress={createQuiz}
                    textStyles="text-white px-2 p-2"
                    containerStyles="m-1 w-40"
                  />
                  <CustomButton
                    title="Cancel"
                    handlePress={() => setModalVisible(false)}
                    textStyles="text-white px-2 p-2"
                    containerStyles="m-1 w-40"
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        <Modal
          visible={quizModalVisible}
          animationType="slide"
          transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text
                style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
                Take Quiz
              </Text>
              {currentQuiz && (
                <FlatList
                  data={currentQuiz.questions}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={{ fontWeight: "bold" }}>{item.text}</Text>
                      {item.options.map((opt, i) => (
                        <TouchableOpacity
                          key={i}
                          style={{
                            backgroundColor: userAnswers[index]?.includes(
                              opt.text
                            )
                              ? "#90caf9"
                              : "#eeeeee",
                            padding: 8,
                            marginVertical: 4,
                            borderRadius: 5,
                          }}
                          disabled={isSubmitted}
                          onPress={() => {
                            const selectedAnswers = userAnswers[index] || [];
                            if (selectedAnswers.includes(opt.text)) {
                              setUserAnswers({
                                ...userAnswers,
                                [index]: selectedAnswers.filter(
                                  (answer) => answer !== opt.text
                                ),
                              });
                            } else {
                              setUserAnswers({
                                ...userAnswers,
                                [index]: [...selectedAnswers, opt.text],
                              });
                            }
                          }}>
                          <Text>{opt.text}</Text>
                        </TouchableOpacity>
                      ))}
                      {isSubmitted && (
                        <Text style={{ marginTop: 8 }}>
                          {item.options.every(
                            (opt) =>
                              userAnswers[index]?.includes(opt.text) ===
                              opt.isCorrect
                          ) ? (
                            <FontAwesome name="check" size={20} color="green" />
                          ) : (
                            <FontAwesome name="times" size={20} color="red" />
                          )}
                        </Text>
                      )}
                    </View>
                  )}
                />
              )}
              <View className="flex-row justify-around">
                <CustomButton
                  title="Submit Quiz"
                  handlePress={handleSubmitQuiz}
                  containerStyles="m-1 w-40"
                  textStyles="text-white px-2 p-2"
                />
                <CustomButton
                  title="Cancel"
                  handlePress={() => setQuizModalVisible(false)}
                  containerStyles="m-1 w-40"
                  textStyles="text-white px-2 p-2"
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f4" },
  quizCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 12,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  quizTitle: { fontSize: 16, fontWeight: "bold" },
  quizType: { fontSize: 14, color: "#333" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 10,
    width: "90%",
    maxHeight: "90%",
  },
  button: {
    padding: 10,
    marginTop: 10,
    backgroundColor: "#1E90FF",
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "gray",
  },
});

export default QuizPage;
