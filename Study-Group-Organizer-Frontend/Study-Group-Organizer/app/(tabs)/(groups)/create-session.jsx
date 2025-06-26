import { View, Text, SafeAreaView, ScrollView, Alert } from "react-native";
import { useState, useEffect } from "react";
import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import { router, useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Calendar } from "react-native-calendars";
import DateTimePicker from "@react-native-community/datetimepicker";
import config from "../../../constants/config";

const CreateSession = () => {
  const { groupId } = useLocalSearchParams();
  const [form, setForm] = useState({
    name: "",
    startDate: null,
    endDate: null,
    startTime: null,
    endTime: null,
    acceptedBy: [],
  });

  const [selecting, setSelecting] = useState("startDate");
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    validateForm();
  }, [form]);

  const validateField = (field, value) => {
    let error = "";

    const now = new Date();

    if (field === "name" && !value) error = "Session name is required.";
    if (field === "startDate" && !value) error = "Start date is required.";
    if (field === "endDate" && !value) error = "End date is required.";
    if (field === "startTime" && !value) error = "Start time is required.";
    if (field === "endTime" && !value) error = "End time is required.";

    if (
      field === "endDate" &&
      value &&
      form.startDate &&
      value < form.startDate
    ) {
      error = "End date cannot be before the start date.";
    }

    if (
      field === "endTime" &&
      value &&
      form.startTime &&
      value <= form.startTime &&
      form.startDate === form.endDate
    ) {
      error = "End time must be after start time for the same day.";
    }

    if (
      field === "startTime" &&
      form.startDate &&
      value &&
      new Date(`${form.startDate}T${value}`) <= now
    ) {
      error = "Start time must be after the current date and time.";
    }

    setValidationErrors((prevErrors) => ({
      ...prevErrors,
      [field]: error,
    }));
  };

  const validateForm = () => {
    Object.entries(form).forEach(([key, value]) => validateField(key, value));
  };

  const handleDateSelect = (day) => {
    const field = selecting;
    const value = day.dateString;
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
    validateField(field, value);
  };

  const handleTimeConfirm = (field, selectedTime) => {
    const value = selectedTime.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setForm((prevForm) => ({ ...prevForm, [field]: value }));
    validateField(field, value);
  };

  const isFormValid = () => {
    return (
      Object.values(validationErrors).every((error) => !error) &&
      Object.values(form).every((value) => value)
    );
  };

  const getLoggedUser = async () => {
    try {
      const loggedUser = await AsyncStorage.getItem("loggedUser");
      if (loggedUser) {
        return loggedUser;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };

  const submit = async () => {
    if (!isFormValid()) {
      Alert.alert("Error", "Please fix all errors.");
      return;
    }

    const loggedUser = await getLoggedUser();
    if (!loggedUser) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    const session = {
      name: form.name,
      startDate: form.startDate,
      endDate: form.endDate,
      startTime: form.startTime,
      endTime: form.endTime,
      acceptedBy: [loggedUser],
      groupId: groupId,
    };
    try {
      const response = await axios.post(
        `${config.SERVER_URL}/createSession`,
        session
      );
      if (response.data.success) {
        Alert.alert("Success", response.data.message);

        setForm({
          name: "",
          startDate: null,
          endDate: null,
          startTime: null,
          endTime: null,
          acceptedBy: [],
        });
      } else {
        if (response.status === 400 || !response.data.success)
          Alert.alert(
            "Error",
            "Session overlaps with another! Change the date or time"
          );
      }
    } catch (error) {
      Alert.alert("Error", "The session overlaps with an existing session.");
      console.error("Error creating session:", error.message);
    }
  };

  const cancel = () => {
    router.replace(`/group-page?groupId=${groupId}`);
  };

  const goToCalendar = () => {
    router.push("/home-page");
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 16 }}>
          Create Session
        </Text>

        <FormField
          title="Session Name"
          value={form.name}
          handleChangeText={(text) => setForm({ ...form, name: text })}
          placeholder="Enter session name"
        />
        {validationErrors.name && (
          <Text className="mx-6 text-red-600 text-sm">
            {validationErrors.name}
          </Text>
        )}

        <View style={{ marginVertical: 16 }}>
          <Text style={{ fontSize: 16 }}>
            {selecting === "startDate"
              ? "Selecting Start Date"
              : "Selecting End Date"}
          </Text>
          <Calendar
            current={form[selecting] || undefined}
            markedDates={{
              [form.startDate]: { selected: true, selectedColor: "blue" },
              [form.endDate]: { selected: true, selectedColor: "purple" },
            }}
            onDayPress={handleDateSelect}
          />
          <View className="flex-row">
            {validationErrors.startDate && (
              <Text className="mx-6 text-red-600 text-sm">
                {validationErrors.startDate}
              </Text>
            )}
            {validationErrors.endDate && (
              <Text className="mx-6 text-red-600 text-sm">
                {validationErrors.endDate}
              </Text>
            )}
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: 10,
            }}>
            <CustomButton
              title="Select Start Date"
              handlePress={() => setSelecting("startDate")}
              textStyles="text-white px-2 p-2"
            />
            <CustomButton
              title="Select End Date"
              handlePress={() => setSelecting("endDate")}
              textStyles="text-white px-2 p-2"
            />
          </View>
        </View>

        <View className="flex-row items-center pb-2 pl-14">
          <View className="items-center pb-4 pr-14 mr-10">
            <Text className="pb-2">Start Time</Text>
            <DateTimePicker
              value={
                form.startTime
                  ? new Date(`1970-01-01T${form.startTime}:00`)
                  : new Date()
              }
              mode="time"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  handleTimeConfirm("startTime", selectedDate);
                }
              }}
            />
          </View>

          <View className="items-center pb-4">
            <Text className="items-center pb-2">End Time</Text>
            <DateTimePicker
              value={
                form.endTime
                  ? new Date(`1970-01-01T${form.endTime}:00`)
                  : new Date()
              }
              mode="time"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  handleTimeConfirm("endTime", selectedDate);
                }
              }}
            />
          </View>
        </View>
        <View className="flex-row">
          {validationErrors.startTime && (
            <Text className="mx-6 text-red-600 text-sm">
              {validationErrors.startTime}
            </Text>
          )}
          {validationErrors.endTime && (
            <Text className="mx-6 text-red-600 text-sm">
              {validationErrors.endTime}
            </Text>
          )}
        </View>

        <View className="flex-row items-center mx-4 mb-4">
          <CustomButton
            title="Create"
            handlePress={submit}
            containerStyles="m-3 w-50"
            textStyles="text-white px-2 p-2"
          />

          <CustomButton
            title="Back to group"
            handlePress={cancel}
            containerStyles="m-3 w-30"
            textStyles="text-white px-2 p-2"
          />

          <CustomButton
            title="Go to Calendar"
            handlePress={goToCalendar}
            containerStyles="m-3 w-30"
            textStyles="text-white px-2 p-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CreateSession;
