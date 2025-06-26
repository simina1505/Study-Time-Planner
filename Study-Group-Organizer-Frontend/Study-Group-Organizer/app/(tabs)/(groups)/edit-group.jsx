import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  Switch,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import FormField from "../../../components/FormField";
import CustomButton from "../../../components/CustomButton";
import { useLocalSearchParams, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../../constants/config";
import {
  MultipleSelectList,
  SelectList,
} from "react-native-dropdown-select-list";

const EditGroup = () => {
  const { groupId } = useLocalSearchParams();
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [group, setGroup] = useState(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    privacy: "Public",
  });
  const [errors, setErrors] = useState({});
  const [selectedCity, setSelectedCity] = useState({
    key: "1",
    value: "Adjud",
  });
  const [city, setCity] = useState("");
  const [citiesList, setCitiesList] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  React.useEffect(() => {
    if (groupId) {
      const loadData = async () => {
        await getCitiesFromDB();
        await getSubjectsFromDB();
        await getGroupData();
      };
      loadData();
    }
  }, [groupId]);

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

  const getSubjectsFromDB = async () => {
    try {
      const response = await axios.get(`${config.SERVER_URL}/getSubjects`);
      if (response.data.success) {
        setSubjectsList(response.data.subjects);
      }
    } catch (error) {
      console.error("Error fetching subjects", error);
      Alert.alert("Error", "Failed to fetch subjects.");
    }
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

  const getGroupData = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchGroup/${groupId}`
      );
      if (response.data.success) {
        const groupData = response.data.group;
        setForm({
          name: groupData.name,
          description: groupData.description,
          privacy: groupData.privacy,
        });
        setGroup(groupData);
        updateCityState(groupData.city);
      }
    } catch (error) {
      console.error("Error fetching group data:", error);
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
      privacy: form.privacy,
      city: city,
      subject: selectedSubjects,
      creator: loggedUser,
    };

    try {
      await axios
        .post(`${config.SERVER_URL}/editGroup/${groupId}`, group)
        .then((response) => {
          if (response && response.data.success === true) {
            Alert.alert("Success", "Group updated successfully");
            router.replace("/my-groups");
          } else {
            Alert.alert("Error", "Please fix all the errors.");
          }
        })
        .catch((error) => {
          Alert.alert("Error", error.message);
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
    <SafeAreaView className="h-full">
      <ScrollView>
        <View className="w-full justify-center px-4 my-6">
          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              marginBottom: 16,
              marginLeft: 14,
            }}>
            Edit Group
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
              setSelected={(val) => {
                setSelectedSubjects(val);
              }}
              data={subjectsList}
              save="value"
              notFoundText="No subject exists"
              placeholder="Select subjects"
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

          <View style={{ marginBottom: 16 }} className="justofy-center mx-6">
            <Text style={styles.label}>City</Text>
            <SelectList
              setSelected={(val) => {
                setCity(val);
              }}
              data={citiesList}
              defaultOption={
                selectedCity
                  ? { key: selectedCity.key, value: selectedCity.value }
                  : { key: group.city, value: group.city }
              }
              save="value"
              placeholder="Select a city"
              boxStyles={styles.selectBox}
              inputStyles={styles.selectInput}
              dropdownStyles={styles.selectDropdown}
              dropdownTextStyles={styles.selectDropdownText}
            />
          </View>
          <View className="flex-row items-center mx-6 mb-4">
            <Text className="text-lg mr-2">{form.privacy}</Text>
            <Switch
              value={form.privacy === "Private"}
              onValueChange={togglePrivacy}
            />
          </View>

          <View className="flex-row justify-between mx-6">
            <CustomButton
              title="Save Changes"
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

const styles = StyleSheet.create({
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
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: "#b3b3b3",
  },
});
export default EditGroup;
