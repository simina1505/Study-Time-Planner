import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
  Modal,
  ActionSheetIOS,
  Dimensions,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState } from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import { PieChart } from "react-native-chart-kit";
import CustomButton from "../../../components/CustomButton";
import config from "../../../constants/config";
import FormField from "../../../components/FormField";
import { SelectList } from "react-native-dropdown-select-list";

const ProfilePage = () => {
  const { userId: initialUserId } = useLocalSearchParams() || {};
  const [userId, setUserId] = useState(initialUserId);
  const [user, setUser] = useState("");
  const [username, setUsername] = useState("");
  const [loggedUserId, setLoggedUserId] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [taskStats, setTaskStats] = useState([]);
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [form, setForm] = useState({
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  });
  const [selectedCity, setSelectedCity] = useState({
    key: "1",
    value: "Adjud",
  });
  const [city, setCity] = useState("");
  const [citiesList, setCitiesList] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isWaitingForValidation, setIsWaitingForValidation] = useState(false);
  const [updatedEmail, setUpdatedEmail] = useState("");

  useFocusEffect(
    React.useCallback(() => {
      getLoggedUser();
    }, [])
  );

  React.useEffect(() => {
    if (initialUserId) {
      setUserId(initialUserId);
    } else if (loggedUserId) {
      setUserId(loggedUserId);
    }
  }, [initialUserId, loggedUserId]);

  React.useEffect(() => {
    const fetchData = async () => {
      await getCitiesFromDB();

      if (userId) {
        fetchUserInfo(userId);
      }
    };
    fetchData();
  }, [userId]);

  const screenWidth = Dimensions.get("window").width;

  const getCitiesFromDB = async () => {
    try {
      const response = await axios.get(`${config.SERVER_URL}/getCities`);
      if (response.data.success) {
        setCitiesList(response.data.cities);
      }
    } catch (error) {
      console.error("Error fetching cities", error);
      Alert.alert("Error", "Failed to fetch cities.");
    }
  };

  const fetchTaskStats = async (userId) => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/taskStatisticsForUser/${userId}`
      );
      if (response.data.success) {
        setTaskStats(response.data.tasks);
      }
    } catch (error) {
      console.error("Error fetching task statistics:", error);
    }
  };

  const formatDataForPieChart = (stats) => {
    const colors = ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"];
    return stats?.map((item, index) => ({
      name: item._id,
      population: item.count,
      color: colors[index % colors.length],
      legendFontColor: "#000",
      legendFontSize: 14,
    }));
  };

  const handleLogout = async () => {
    if (userId && userId !== loggedUserId) return;
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            await AsyncStorage.removeItem("loggedUser");
            await AsyncStorage.removeItem("loggedUserId");
            router.push("sign-in");
          } catch (error) {
            console.error("Error during logout:", error);
            Alert.alert("Error", "An error occurred while logging out.");
          }
        },
      },
    ]);
  };

  const fetchUserInfo = async (userId) => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/getUser/${userId}`
      );
      if (response.data.success) {
        setUser(response.data.user);
        setProfilePicture(response.data.user.profilePicture);
        setUsername(response.data.user.username);
        setForm(response.data.user);
        updateCityState(response.data.user.city);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const getLoggedUser = async () => {
    try {
      const loggedId = await AsyncStorage.getItem("loggedUserId");
      setLoggedUserId(loggedId);
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };

  const handleProfilePicture = async () => {
    if (userId && userId !== loggedUserId) return;

    const options = ["Take Photo", "Choose from Gallery", "Cancel"];
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: options,
        cancelButtonIndex: 2,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          await openCamera();
        } else if (buttonIndex === 1) {
          await openGallery();
        }
      }
    );
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission required",
        "Permission to access the camera is required!"
      );
      return;
    }

    const pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const localUri = pickerResult.assets[0].uri;
      uploadProfilePicture(localUri);
    }
  };

  const openGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission required",
        "Permission to access media library is required!"
      );
      return;
    }

    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!pickerResult.canceled) {
      const localUri = pickerResult.assets[0].uri;
      uploadProfilePicture(localUri);
    }
  };

  const uploadProfilePicture = async (localUri) => {
    const formData = new FormData();
    formData.append("file", {
      uri: localUri,
      name: "profile-picture.jpg",
      type: "image/jpeg",
    });
    formData.append("userId", user._id);
    setIsUploading(true);
    try {
      const response = await axios.post(
        `${config.SERVER_URL}/uploadProfilePicture`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.success) {
        fetchUserInfo(user._id);
        Alert.alert("Success", "Profile picture updated successfully.");
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      Alert.alert("Error", "An error occurred while uploading the picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const validateEmail = async (email) => {
    if (!email) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format.";

    if (email === user.email) return "";

    try {
      const response = await axios.post(
        `${config.SERVER_URL}/checkUserExistence`,
        {
          field: "email",
          value: email,
        }
      );
      if (!response.data.available) return "Email is already in use.";
    } catch (error) {
      console.error("Error checking email availability:", error);
      return "Error checking email.";
    }
    return "";
  };

  const validateUsername = async (username) => {
    if (!username) return "Username is required.";
    if (username.length < 3)
      return "Username must be at least 3 characters long.";

    try {
      const response = await axios.post(
        `${config.SERVER_URL}/checkUserExistence`,
        {
          field: "username",
          value: username,
        }
      );
      if (!response.data.available) return "Username is already taken.";
    } catch (error) {
      console.error("Error checking username availability:", error);
      return "Error checking username.";
    }
    return "";
  };

  const handleChangeText = async (field, value) => {
    setForm({ ...form, [field]: value });

    let errorMessage = "";
    if (field === "username") {
      if (value !== user.username) {
        errorMessage = await validateUsername(value);
      }
    } else if (field === "email") {
      errorMessage = await validateEmail(value);
    }

    setErrors({ ...errors, [field]: errorMessage });
  };

  const updateCityState = (cityName) => {
    const matchedCity = citiesList.find((city) => city.value === cityName);
    if (matchedCity) {
      setSelectedCity(matchedCity);
      setCity(matchedCity.value);
    } else {
      setSelectedCity(null);
      setCity("");
    }
  };

  const handleUpdateUserInfo = async () => {
    const formErrors = Object.values(errors).filter((error) => error !== "");
    if (formErrors.length > 0) {
      Alert.alert("Error", "Please fix the errors in the form.");
      return;
    }

    if (!form.firstName || !form.lastName || !form.username || !form.email) {
      Alert.alert("Error", "Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    const cityValue = citiesList.find((c) => c.key === city)?.value || city;

    try {
      const response = await axios.patch(`${config.SERVER_URL}/updateUser`, {
        userId: user._id,
        username: form.username,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        city: cityValue,
      });

      if (response.data.success) {
        Alert.alert("Success", "User information updated successfully.");
        setUser(response.data.user);
        setEditModalVisible(false);
        setForm(response.data.user);
        setUsername(response.data.user.username);

        if (user.email !== form.email) {
          setUpdatedEmail(form.email);
          setIsWaitingForValidation(true);
        }

        updateCityState(response.data.user.city);
      } else {
        Alert.alert("Error", response.data.message);
      }
    } catch (error) {
      console.error("Error updating user info:", error);
      Alert.alert("Error", "An error occurred while updating user info.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async (userId) => {
    try {
      const response = await axios.get(`${config.SERVER_URL}/verifyEmail`, {
        params: { userId, email: updatedEmail },
      });

      if (response.data.success) {
        Alert.alert("Success", "Your email has been successfully verified!");
        setUser((prevUser) => ({
          ...prevUser,
          email: updatedEmail,
        }));
        setForm((prevForm) => ({
          ...prevForm,
          email: updatedEmail,
        }));
        setIsWaitingForValidation(false);
      } else {
        Alert.alert(
          "Error",
          "Validate the email again. If still not working, resend the link to the email."
        );
        setIsWaitingForValidation(false);
      }
    } catch (error) {
      console.error("Error verifying email:", error);
      Alert.alert("Error", "An error occurred while verifying your email.");
    }
  };

  return (
    <SafeAreaView className="w-full min-h-[85vh] px-4 my-6">
      <View className="flex-row justify-center">
        <View>
          <Text
            style={{
              textAlign: "center",
              justifyContent: "center",
              marginVertical: 10,
              fontSize: 20,
              fontWeight: "bold",
            }}>
            {username}
            {"'s Profile"}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: "center", marginVertical: 20 }}>
        <TouchableOpacity
          onPress={handleProfilePicture}
          disabled={!(userId && userId === loggedUserId)}>
          <Image
            source={
              profilePicture
                ? {
                    uri: profilePicture,
                  }
                : require("../../../assets/blank-profile-picture.png")
            }
            style={{
              width: 200,
              height: 200,
              borderRadius: 100,
              borderWidth: 6,
              borderColor: "#504357",
            }}
          />
        </TouchableOpacity>
        <Text
          style={{
            marginTop: 10,
            fontSize: 16,
            fontWeight: "bold",
            color: "#555",
          }}>
          {userId && userId === loggedUserId ? "Tap to change picture" : ""}
        </Text>
        {isUploading && (
          <ActivityIndicator
            size="large"
            color="#504357"
            style={{ marginTop: 10 }}
          />
        )}
      </View>
      <View
        style={{
          marginHorizontal: 8,
          backgroundColor: "#504357",
          borderRadius: 12,
          padding: 2,
          height: 180,
          marginTop: 20,
        }}>
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            width: Platform.OS == "ios" ? 370 : 305,
            padding: 10,
            backgroundColor: "#f0f0f0",
            borderRadius: 8,
            height: 150,
          }}>
          <View className="flex-row justify-between">
            <Text style={{ fontSize: 16, marginBottom: 6 }}>
              <Text style={{ fontWeight: "bold", color: "#555" }}>Email:</Text>{" "}
              <Text className="underline" style={{ color: "blue" }}>
                {user.email}
              </Text>
            </Text>
            {userId && userId === loggedUserId && (
              <TouchableOpacity
                onPress={() => setEditModalVisible(true)}
                style={{ marginRight: 10 }}>
                <FontAwesome name="pencil" size={24} color="#504357" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={{ fontSize: 16, marginBottom: 6 }}>
            <Text style={{ fontWeight: "bold", color: "#555" }}>
              First Name:
            </Text>{" "}
            {user.firstName}
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 6 }}>
            <Text style={{ fontWeight: "bold", color: "#555" }}>
              Last Name:
            </Text>{" "}
            {user.lastName}
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 6 }}>
            <Text style={{ fontWeight: "bold", color: "#555" }}>City:</Text>{" "}
            {user.city}
          </Text>
          <View className="flex-row justify-end">
            <CustomButton
              title="View Task Statistics"
              handlePress={() => {
                fetchTaskStats(userId);
                setStatsModalVisible(true);
              }}
              containerStyles="w-40  "
              textStyles="text-white px-2 p-1.5"
            />
          </View>
        </View>
      </View>
      <View style={{ alignItems: "center", marginTop: 20 }}>
        {userId && userId === loggedUserId && (
          <TouchableOpacity onPress={handleLogout} style={{ top: 10 }}>
            <View className="flex-row">
              <Text
                className="pt-2 pr-1"
                style={{ fontSize: 18, fontWeight: "bold" }}>
                Log out
              </Text>
              <FontAwesome size={35} name="sign-out" color="#504357" />
            </View>
          </TouchableOpacity>
        )}
      </View>
      <Modal visible={statsModalVisible} animationType="slide">
        <SafeAreaView className="w-full justify-center min-h-[85vh] px-4 my-6">
          <View>
            <View>
              <Text
                style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  marginBottom: 16,
                  marginLeft: 16,
                }}>
                Task Statistics
              </Text>

              {taskStats.length > 0 ? (
                <PieChart
                  data={formatDataForPieChart(taskStats)}
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

      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 30}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                <Text style={styles.modalTitle}>Update User Info</Text>
                {[
                  {
                    title: "First Name",
                    field: "firstName",
                    placeholder: "Type first name...",
                  },
                  {
                    title: "Last Name",
                    field: "lastName",
                    placeholder: "Type last name...",
                  },
                  {
                    title: "Username",
                    field: "username",
                    placeholder: "Type username...",
                  },
                  {
                    title: "Email",
                    field: "email",
                    placeholder: "Type email...",
                  },
                ].map(({ title, field, placeholder }) => (
                  <View key={field}>
                    <FormField
                      title={title}
                      value={form[field]}
                      handleChangeText={(e) => handleChangeText(field, e)}
                      otherStyles="mb-4"
                      placeholder={placeholder}
                    />
                    {errors[field] && (
                      <Text className="mx-2 text-red-600 text-sm mb-4">
                        {errors[field]}
                      </Text>
                    )}
                  </View>
                ))}
                <View style={{ marginBottom: 16 }}>
                  <Text style={styles.label}>City</Text>
                  <SelectList
                    setSelected={(val) => {
                      setCity(val);
                    }}
                    data={citiesList}
                    defaultOption={
                      selectedCity
                        ? { key: selectedCity.key, value: selectedCity.value }
                        : { key: user.city, value: user.city }
                    }
                    save="value"
                    placeholder="Select a city"
                    boxStyles={styles.selectBox}
                    inputStyles={styles.selectInput}
                    dropdownStyles={styles.selectDropdown}
                    dropdownTextStyles={styles.selectDropdownText}
                  />
                </View>
                <View className="flex-row justify-between">
                  <CustomButton
                    title="Save Changes"
                    handlePress={handleUpdateUserInfo}
                    isLoading={isSubmitting}
                    containerStyles=" w-40"
                    textStyles="text-white px-2 p-2"
                  />
                  <CustomButton
                    title="Cancel"
                    handlePress={() => {
                      setEditModalVisible(false);
                      setErrors({});
                      setForm(user);
                    }}
                    containerStyles=" w-40"
                    textStyles="text-white px-2 p-2"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={isWaitingForValidation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsWaitingForValidation(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text
              style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              Waiting for Email Validation
            </Text>
            <ActivityIndicator size="large" color="#504357" />
            <Text style={{ marginTop: 10, textAlign: "center", color: "#555" }}>
              Please check your email and click the verification link.
            </Text>
            <CustomButton
              title="Done"
              handlePress={() => verifyEmail(user._id)}
              containerStyles="m-2"
              textStyles="text-white px-2 p-2"></CustomButton>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  editButton: {
    backgroundColor: "#504357",
    padding: 10,
    borderRadius: 8,
    alignSelf: "center",
    marginVertical: 20,
  },
  editButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#b3b3b3",
  },
  selectBox: {
    backgroundColor: "#e0d6e2",
    borderColor: "#7f6b89",
    borderWidth: 2,
    borderRadius: 16,
    minHeight: 65,
    alignItems: "center",
  },
  selectInput: {
    color: "gray",
    fontSize: 16,
  },
  selectDropdown: {
    backgroundColor: "#ffffff",
    borderColor: "#7f6b89",
  },
  selectDropdownText: {
    color: "#333",
  },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 8,
  },
});
export default ProfilePage;
