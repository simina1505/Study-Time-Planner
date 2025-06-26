import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { useEffect } from "react";
import FormField from "../../../components/FormField";
import { useState } from "react";
import CustomButton from "../../../components/CustomButton";
import { router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  MultipleSelectList,
  SelectList,
} from "react-native-dropdown-select-list";
import config from "../../../constants/config";
const createGroup = () => {
  const [subjectsList, setSubjectsList] = useState([]);
  const [subjects, setSelected] = useState([]);
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    privacy: "Public",
  });
  const [errors, setErrors] = useState({});
  const [city, setCity] = useState(null);
  const [citiesList, setCitiesList] = useState([]);

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

  useEffect(() => {
    getSubjectsFromDB();
    getCitiesFromDB();
  }, []);

  const getCitiesFromDB = async () => {
    try {
      const response = await axios.get(`${config.SERVER_URL}/getCities`);
      if (response.data.success) {
        setCitiesList(response.data.cities);
      }
    } catch (error) {
      console.error("Error fetching cities", error);
      return "Error fetching cities.";
    }
  };

  const getSubjectsFromDB = async () => {
    try {
      const response = await axios.get(`${config.SERVER_URL}/getSubjects`);
      if (response.data.success) {
        setSubjectsList(response.data.subjects);
      }
    } catch (error) {
      console.error("Error fetching subjects", error);
      return "Error fetching subjects.";
    }
  };

  const togglePrivacy = () => {
    setForm((prevForm) => ({
      ...prevForm,
      privacy: prevForm.privacy === "Public" ? "Private" : "Public",
    }));
  };

  const handleChangeText = async (field, value) => {
    setForm({ ...form, [field]: value });

    let errorMessage = "";
    errorMessage = await validateGroupName(value);

    setErrors({ ...errors, [field]: errorMessage });
  };

  const validateGroupName = async (name) => {
    if (!name) return "Group name is required.";
    try {
      const response = await axios.post(
        `${config.SERVER_URL}/checkGroupExistence`,
        {
          field: "name",
          value: name,
        }
      );
      if (!response.data.available) return "Group name is already taken.";
    } catch (error) {
      console.error("Error checking group name availability:", error);
      return "Error checking group name.";
    }
    return "";
  };

  const submit = async () => {
    if (!form.name) {
      Alert.alert("Error", "Please enter group name");
    }
    if (!form.description) {
      Alert.alert("Error", "Please enter description");
    }

    if (!city) {
      Alert.alert("Error", "Please pick a city");
    }
    if (subjects.length == 0) {
      Alert.alert("Error", "Please pick a least one subject");
    }

    const loggedUser = await getLoggedUser();
    if (!loggedUser) {
      Alert.alert("Error", "User not logged in");
      setIsSubmiting(false);
      return;
    }

    setIsSubmiting(true);
    const group = {
      name: form.name,
      description: form.description,
      subject: subjects,
      privacy: form.privacy,
      creator: loggedUser,
      city: city,
    };
    try {
      await axios
        .post(`${config.SERVER_URL}/createGroup`, group)
        .then((response) => {
          if (response && response.data.success === true) {
            router.replace("/my-groups");
          } else {
            Alert.alert("Error", "Please fix all the errors.");
          }
        })
        .catch((error) => {
          Alert.alert("Error", error.message);
          console.log("group creation error:", error);
        });
    } catch (error) {
      console.log(error.message);
    } finally {
      setIsSubmiting(false);
    }
  };

  const cancel = () => {
    router.replace("/my-groups");
  };

  return (
    <SafeAreaView className=" h-full">
      <ScrollView>
        <View className="w-full justify-center px-4 my-6 ">
          <Text
            className="mx-6 mb-6"
            style={{ fontSize: 30, fontWeight: "bold" }}>
            Create Group
          </Text>
          <FormField
            title="Group Name"
            value={form.name}
            handleChangeText={(e) => handleChangeText("name", e)}
            otherStyles="mx-6"
            keyboardType="default"
            placeholder="type group name"
          />
          {errors["name"] && (
            <Text className="mx-6 text-red-600 text-sm">{errors["name"]}</Text>
          )}

          <FormField
            title="Description"
            value={form.description}
            handleChangeText={(e) => setForm({ ...form, description: e })}
            otherStyles="mx-6 mb-4"
            keyboardType="default"
            placeholder="type a description"
          />

          <View className="mx-6">
            <Text style={{ fontSize: 16, marginBottom: 8, color: "#b3b3b3" }}>
              Subjects
            </Text>
            <MultipleSelectList
              setSelected={(val) => setSelected(val)}
              data={subjectsList}
              save="value"
              notFoundText="No subject exists"
              placeholder="select subjects"
              boxStyles={{
                backgroundColor: "#e0d6e2",
                borderColor: "#7f6b89",
                borderWidth: 2,
                borderRadius: 16,
                minHeight: 65,
                alignItems: "center",
              }}
              inputStyles={{
                color: "gray",
                fontSize: 16,
              }}
              dropdownStyles={{
                backgroundColor: "#ffffff",
                borderColor: "#7f6b89",
              }}
              dropdownItemStyles={{
                borderBottomColor: "#ddd",
                borderBottomWidth: 1,
              }}
              dropdownTextStyles={{
                color: "#333",
              }}
            />
          </View>

          <View className="mx-6  mb-4">
            <Text style={{ fontSize: 16, marginBottom: 8, color: "#b3b3b3" }}>
              City
            </Text>
            <SelectList
              setSelected={(val) => setCity(val)}
              data={citiesList}
              save="value"
              notFoundText="No subject exists"
              placeholder="select a city"
              boxStyles={{
                backgroundColor: "#e0d6e2",
                borderColor: "#7f6b89",
                borderWidth: 2,
                borderRadius: 16,
                height: 65,
                alignItems: "center",
              }}
              inputStyles={{
                color: "gray",
                fontSize: 16,
              }}
              dropdownStyles={{
                backgroundColor: "#ffffff",
                borderColor: "#7f6b89",
              }}
              dropdownItemStyles={{
                borderBottomColor: "#ddd",
                borderBottomWidth: 1,
              }}
              dropdownTextStyles={{
                color: "#333",
              }}
            />
          </View>

          <View className="flex-row items-center mx-6 mb-4">
            <Text className="text-lg mr-2 " style={{ color: "#b3b3b3" }}>
              {form.privacy}
            </Text>
            <Switch
              value={form.privacy === "Private"}
              onValueChange={togglePrivacy}
            />
          </View>

          <View className="flex-row justify-between mx-6">
            <CustomButton
              title="Create"
              handlePress={submit}
              containerStyles="mb-6 w-40"
              isLoading={isSubmiting}
              textStyles="text-white px-2 p-2"
            />

            <CustomButton
              title="Cancel"
              handlePress={cancel}
              containerStyles="mb-6 w-40"
              textStyles="text-white px-2 p-2"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default createGroup;
