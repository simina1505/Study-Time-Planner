import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Calendar } from "react-native-calendars";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import config from "../../../constants/config";

const HomePage = () => {
  const [username, setUsername] = useState("");
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [viewMode, setViewMode] = useState("sessions");
  const [daySessions, setDaySessions] = useState([]);
  const [dayTasks, setDayTasks] = useState([]);

  useEffect(() => {
    const initialize = async () => {
      await getLoggedUser();
    };
    initialize();
  }, []);

  useEffect(() => {
    if (viewMode === "sessions") {
      markSessionDates(sessions);
    } else {
      markTaskDeadlines(tasks);
    }
  }, [viewMode, sessions, tasks]);

  useFocusEffect(
    React.useCallback(() => {
      if (username) {
        fetchUserSessions();
        fetchUserTasks();
      }
    }, [username])
  );
  const getLoggedUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("loggedUserId");
      const loggedUser = await AsyncStorage.getItem("loggedUser");
      if (loggedUser) {
        setUsername(loggedUser);
      }

      if (userId) {
        setLoggedUserId(userId);
      }
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };

  const fetchUserSessions = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchUserSessions/${username}`
      );

      if (response.data.success) {
        const sessions = response.data.sessions;
        setSessions(sessions || []);
        if (viewMode === "sessions") markSessionDates(response.data.sessions);
      } else {
        Alert.alert("Error", "Failed to fetch sessions.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "An error occurred while fetching sessions.");
    }
  };

  const fetchUserTasks = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/getTaskByUserId/${loggedUserId}`
      );
      setTasks(response.data.tasks);
      if (viewMode === "tasks") markTaskDeadlines(response.data.tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      Alert.alert("Error", "An error occurred while fetching tasks.");
    }
  };

  const completeTask = async (taskId) => {
    try {
      const response = await axios.patch(
        `${config.SERVER_URL}/completeTask/${taskId}`
      );
      if (response.data.success) {
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task._id === taskId ? response.data.updatedTask : task
          )
        );
        setDayTasks((prevDayTasks) =>
          prevDayTasks.map((task) =>
            task._id === taskId ? response.data.updatedTask : task
          )
        );
      }
    } catch (error) {
      console.error("Error completing task:", error);
      Alert.alert("Error", "An error occurred while completing the task.");
    }
  };

  const handleLeaveSession = async (sessionId) => {
    Alert.alert(
      "Leave Session",
      "Are you sure you want to leave the session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${config.SERVER_URL}/leaveSession/${sessionId}`,
                { username: loggedUser }
              );

              if (response.data.success) {
                Alert.alert("Success", response.data.message);

                setSessions((prevSessions) =>
                  prevSessions.filter((session) => session._id !== sessionId)
                );
              } else {
                Alert.alert("Error", response.data.message);
              }
            } catch (error) {
              console.error("Error leaving session:", error);
              Alert.alert("Error", "Failed to leave the session.");
            }
          },
        },
      ]
    );
  };

  const markSessionDates = (sessions) => {
    const marked = {};
    sessions.forEach(({ startDate }) => {
      const dateString = new Date(startDate).toISOString().split("T")[0];
      marked[dateString] = {
        selected: true,
        marked: true,
        selectedColor: "#7f6b89",
        dotColor: "white",
        textColor: "white",
      };
    });
    setMarkedDates(marked);
  };

  const markTaskDeadlines = (tasks) => {
    const marked = {};
    tasks.forEach(({ deadline }) => {
      const dateString = new Date(deadline).toISOString().split("T")[0];
      marked[dateString] = {
        selected: true,
        marked: true,
        selectedColor: "#a3c2a0",
        dotColor: "white",
        textColor: "white",
      };
    });
    setMarkedDates(marked);
  };

  const handleDayPress = (day) => {
    setSelectedDay(day.dateString);
    setDaySessions(
      sessions.filter(
        (s) =>
          new Date(s.startDate).toISOString().split("T")[0] === day.dateString
      )
    );
    setDayTasks(
      tasks.filter(
        (t) =>
          new Date(t.deadline).toISOString().split("T")[0] === day.dateString
      )
    );
  };

  const removeTask = async (taskId) => {
    Alert.alert(
      "Remove Task",
      "Are you sure you want to remove this task from your list?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.patch(`${config.SERVER_URL}/removeTask/${taskId}`);
              Alert.alert("Success", "Task removed successfully.");

              setTasks(tasks.filter((task) => task._id !== taskId));
              setDayTasks(dayTasks.filter((task) => task._id !== taskId));

              if (viewMode === "tasks") {
                markTaskDeadlines(tasks.filter((task) => task._id !== taskId));
              }
            } catch (error) {
              console.error("Error removing task:", error);
              Alert.alert("Error", "Failed to remove the task.");
            }
          },
        },
      ]
    );
  };

  const renderSessions = () => {
    return daySessions.length > 0 ? (
      daySessions.map((session, index) => {
        const endDateTime = session.endDate
          ? new Date(
              `${new Date(session.endDate).toISOString().split("T")[0]}T${
                session.endTime || "00:00"
              }:00`
            )
          : null;
        const isSessionOver = !isNaN(endDateTime) && endDateTime < new Date();

        return (
          <View
            key={index}
            style={[
              styles.taskCard,
              isSessionOver && { borderColor: "#c6bccb", borderWidth: 2 },
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.taskTitle}>{session.name}</Text>
              <TouchableOpacity onPress={() => handleLeaveSession(session._id)}>
                <FontAwesome name="sign-out" size={24} color="#504357" />
              </TouchableOpacity>
            </View>
            <View className="flex-row mb-2">
              <Text style={{ fontWeight: "bold" }}>Group:</Text>
              <Text> {fetchGroupById(session.groupId)}</Text>
            </View>
            <View className="flex-row">
              <Text style={{ fontWeight: "bold" }}>Start:</Text>
              <Text>
                {" "}
                {new Date(session.startDate).toLocaleDateString()}
                {", "}
                {session.startTime || "N/A"}
              </Text>
            </View>
            <View className="flex-row">
              <Text style={{ fontWeight: "bold" }}>End:</Text>
              <Text>
                {" "}
                {new Date(session.startDate).toLocaleDateString()}
                {", "}
                {session.endTime}
              </Text>
            </View>
            {isSessionOver && (
              <Text style={styles.overdueMessage}>Session has ended</Text>
            )}
          </View>
        );
      })
    ) : (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessageText}>
          Select a marked date from the calendar.
        </Text>
      </View>
    );
  };

  const renderTasks = () => {
    return dayTasks.length > 0 ? (
      dayTasks.map((task, index) => {
        const isOverdue =
          new Date(task.deadline) < new Date() && task.status !== "completed";
        const isCompleted = task.status === "completed";

        return (
          <View
            key={index}
            style={[
              styles.taskCard,
              isOverdue && { borderColor: "#c6bccb", borderWidth: 2 },
              isCompleted && { borderColor: "#a3c2a0", borderWidth: 2 },
            ]}>
            <View style={styles.cardHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              <TouchableOpacity onPress={() => removeTask(task._id)}>
                <FontAwesome name="times" size={25} color="#504357" />
              </TouchableOpacity>
            </View>
            <Text style={styles.taskDesc}>{task.description}</Text>
            <View className="flex-row mb-2">
              <Text style={{ fontWeight: "bold" }}>Group:</Text>
              <Text> {fetchGroupById(task.groupId)}</Text>
            </View>
            <Text style={styles.taskDeadline}>
              Deadline: {new Date(task.deadline).toLocaleString()}
            </Text>
            <Text style={styles.taskStatus}>Status: {task.status}</Text>
            {isOverdue && (
              <Text style={styles.overdueMessage}>Deadline has passed</Text>
            )}
            {!isOverdue && !isCompleted && (
              <TouchableOpacity
                style={styles.completeButton}
                onPress={() => completeTask(task._id)}>
                <FontAwesome name="check-circle" size={40} color="green" />
              </TouchableOpacity>
            )}
          </View>
        );
      })
    ) : (
      <View style={styles.emptyMessageContainer}>
        <Text style={styles.emptyMessageText}>
          Select a marked date from the calendar.
        </Text>
      </View>
    );
  };

  const fetchGroupById = async (groupID) => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchGroup/${groupID}`
      );
      if (response.data.success) {
        const groupData = response.data.group;
        return groupData.name;
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }} className="w-full min-h-[85vh] px-4 my-6">
      <View style={{ flex: 1, padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>
          Your Sessions & Tasks
        </Text>
        <Calendar
          markedDates={markedDates}
          theme={{
            todayTextColor: "red",
            arrowColor: "blue",
            dotColor: "white",
            selectedDayBackgroundColor: "blue",
            selectedDayTextColor: "white",
          }}
          onDayPress={handleDayPress}
        />

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            marginVertical: 16,
          }}>
          <TouchableOpacity onPress={() => setViewMode("sessions")}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Sessions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode("tasks")}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Tasks</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          {viewMode === "sessions" ? renderSessions() : renderTasks()}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overdueMessage: {
    color: "#7f6b89",
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 8,
  },
  completeButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDesc: { fontSize: 14, color: "#333" },
  taskDeadline: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  taskStatus: { fontSize: 14, fontWeight: "bold", marginTop: 4 },

  emptyMessageContainer: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    top: "40%",
  },
  emptyMessageText: {
    fontSize: 16,
    color: "#888",
    textAlign: "center",
  },
});

export default HomePage;
