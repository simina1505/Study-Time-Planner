import { useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import CustomButton from "../../../components/CustomButton";
import FormField from "../../../components/FormField";
import axios from "axios";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { PieChart } from "react-native-chart-kit";
import config from "../../../constants/config";

const TaskBoard = () => {
  const { groupId } = useLocalSearchParams();
  const [tasks, setTasks] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    deadline: new Date(),
  });
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [stats, setStats] = useState([]);
  const [statsModalVisible, setStatsModalVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await getLoggedUser();
        await fetchTasks();
        await fetchTaskStats();
      };

      fetchData();
    }, [groupId])
  );

  const fetchTasks = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/getAllTasks/${groupId}`
      );
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/taskStatistics/${groupId}`
      );
      setStats(response.data.tasks);
    } catch (error) {
      console.error("Error fetching task statistics:", error);
    }
  };

  const createTask = async () => {
    try {
      const response = await axios.post(`${config.SERVER_URL}/createTask`, {
        ...newTask,
        createdBy: loggedUserId,
        groupId,
      });
      setTasks([...tasks, response.data.newTask]);
      setNewTask({ title: "", description: "" });
      setModalVisible(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const deleteTask = async (taskId) => {
    Alert.alert("Delete Task", "Are you sure you want to delete the task?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.delete(
              `${config.SERVER_URL}/deleteTask/${taskId}?userId=${loggedUserId}`
            );
            Alert.alert("Success", "Task deleted successfully.");
            setTasks(tasks.filter((task) => task._id !== taskId));
          } catch (error) {
            console.error("Error deleting task:", error);
          }
        },
      },
    ]);
  };

  const claimTask = async (taskId) => {
    try {
      await axios.patch(`${config.SERVER_URL}/claimTask/${taskId}`, {
        userId: loggedUserId,
      });
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (error) {
      console.error("Error caliming task:", error);
    }
  };

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

  const screenWidth = Dimensions.get("window").width;

  const formatDataForPieChart = (stats) => {
    const colors = ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"];
    return stats.map((item, index) => ({
      name: item._id,
      population: item.count,
      color: colors[index % colors.length],
      legendFontColor: "#000",
      legendFontSize: 14,
    }));
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View className="flex-row justify-between">
        <CustomButton
          title="New Task"
          handlePress={() => setModalVisible(true)}
          containerStyles="m-2 w-40"
          textStyles="text-white px-2 p-2"
        />
        <CustomButton
          title="View Task Statistics"
          handlePress={() => {
            fetchTaskStats();
            setStatsModalVisible(true);
          }}
          containerStyles="m-2 w-40"
          textStyles="text-white px-2 p-2"
        />
      </View>
      <View style={styles.container}>
        {tasks.length === 0 ? (
          <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 18, color: "#888" }}>Add new tasks</Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.taskCard}>
                <View className="flex-row justify-between">
                  <Text style={styles.taskTitle}>{item.title}</Text>
                  <TouchableOpacity onPress={() => deleteTask(item._id)}>
                    <FontAwesome name="trash" size={25} color="#504357" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.taskDesc}>{item.description}</Text>
                <Text style={styles.taskDeadline}>
                  Deadline: {new Date(item.deadline).toLocaleString()}
                </Text>
                <View className="flex-row justify-between">
                  <Text style={styles.taskStatus}>Status: {item.status}</Text>

                  <TouchableOpacity onPress={() => claimTask(item._id)}>
                    <FontAwesome name="plus-circle" size={40} color="#504357" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
        <Modal visible={modalVisible} animationType="slide">
          <SafeAreaView className="w-full justify-center min-h-[85vh] px-4 my-6 ">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 16,
                    marginLeft: 16,
                  }}>
                  Create Task
                </Text>
                <FormField
                  title="Title"
                  value={newTask.title}
                  placeholder="Enter task title"
                  handleChangeText={(text) =>
                    setNewTask({ ...newTask, title: text })
                  }
                  otherStyles="mx-3 mb-4"
                />
                <FormField
                  title="Description"
                  value={newTask.description}
                  placeholder="Enter task description"
                  handleChangeText={(text) =>
                    setNewTask({ ...newTask, description: text })
                  }
                  otherStyles="mx-3 mb-4"
                />
                <Text
                  style={{
                    fontSize: 16,
                    color: "#b3b3b3",
                    marginBottom: 8,
                    marginLeft: 16,
                  }}>
                  Set deadline
                </Text>
                <View className="flex-row items-center mx-1 mb-4">
                  <DateTimePicker
                    accentColor="#d8b2d8"
                    value={newTask.deadline || new Date()}
                    mode="datetime"
                    display="default"
                    themeVariant="light"
                    onChange={(event, selectedDate) => {
                      if (selectedDate) {
                        setNewTask({ ...newTask, deadline: selectedDate });
                      }
                    }}
                  />
                </View>

                <View className="flex-row justify-center">
                  <CustomButton
                    title="Create Task"
                    handlePress={createTask}
                    containerStyles="m-2"
                    textStyles="text-white px-2 p-2"
                  />
                  <CustomButton
                    title="Cancel"
                    handlePress={() => setModalVisible(false)}
                    containerStyles="m-2"
                    textStyles="text-white px-2 p-2"
                  />
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Modal>
        <Modal visible={statsModalVisible} animationType="slide">
          <SafeAreaView className="w-full justify-center min-h-[85vh] px-4 my-6">
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text
                  style={{
                    fontSize: 24,
                    fontWeight: "bold",
                    marginBottom: 16,
                    marginLeft: 16,
                  }}>
                  Task Statistics
                </Text>

                {stats.length > 0 ? (
                  <PieChart
                    data={formatDataForPieChart(stats)}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                      backgroundColor: "#f0f0f0",
                      backgroundGradientFrom: "#ffffff",
                      backgroundGradientTo: "#ffffff",
                      color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                      labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    }}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    absolute
                  />
                ) : (
                  <Text
                    style={{
                      fontSize: 16,
                      textAlign: "center",
                      marginVertical: 20,
                    }}>
                    No task data available
                  </Text>
                )}

                <CustomButton
                  title="Close"
                  handlePress={() => setStatsModalVisible(false)}
                  containerStyles="m-2"
                  textStyles="text-white px-2 p-2"
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f4" },
  taskCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskTitle: { fontSize: 16, fontWeight: "bold" },
  taskDesc: { fontSize: 14, color: "#333" },
  taskDeadline: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
  taskStatus: { fontSize: 14, fontWeight: "bold", marginTop: 4 },
});

export default TaskBoard;
