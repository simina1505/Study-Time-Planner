import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useEffect, useRef } from "react";
import FormField from "../../components/FormField";
import { useState } from "react";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import { SelectList } from "react-native-dropdown-select-list";
import config from "../../constants/config";

const SignUp = () => {
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const [errors, setErrors] = useState({});
  const [city, setCity] = useState(null);
  const [citiesList, setCitiesList] = useState([]);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    getCitiesFromDB();
  }, []);

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

  const validateEmail = async (email) => {
    if (!email) return "Email is required.";
    if (!/\S+@\S+\.\S+/.test(email)) return "Invalid email format.";

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

  const validatePassword = (password) => {
    if (!password) return "Password is required.";
    if (password.length < 8)
      return "Password must be at least 8 characters long.";
    if (!/[A-Z]/.test(password))
      return "Password must contain at least one uppercase letter.";
    if (!/[a-z]/.test(password))
      return "Password must contain at least one lowercase letter.";
    if (!/[0-9]/.test(password))
      return "Password must contain at least one number.";
    return "";
  };

  const handleChangeText = async (field, value) => {
    setForm({ ...form, [field]: value });

    let errorMessage = "";
    if (field === "username") errorMessage = await validateUsername(value);
    if (field === "email") errorMessage = await validateEmail(value);
    if (field === "password") errorMessage = validatePassword(value);

    setErrors({ ...errors, [field]: errorMessage });
  };

  const submit = () => {
    const formErrors = Object.values(errors).filter((error) => error !== "");
    if (formErrors.length > 0) {
      Alert.alert("Error", "Please fix the errors in the form.");
      return;
    }

    if (Object.values(form).some((field) => !field)) {
      Alert.alert("Error", "Please fill in all the fields.");
      return;
    }

    setIsSubmiting(true);

    const user = {
      username: form.username,
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
      city: city,
    };
    axios
      .post(`${config.SERVER_URL}/signUp`, user)
      .then(() => {
        Alert.alert(
          "Success",
          "User created successfully! To enter the account verify your email!"
        );
        router.replace("/sign-in");
      })
      .catch((error) => {
        console.log("sign up error", error);
        Alert.alert("Error", error.message);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

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

  return (
    <SafeAreaView className=" h-full">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 15 : 20}>
        <ScrollView ref={scrollViewRef} keyboardShouldPersistTaps="handled">
          <View className="w-full justify-center min-h-[85vh] px-4 my-6 ">
            <Text
              className="mx-6 mb-3"
              style={{ fontSize: 35, fontWeight: "bold" }}>
              Create an account
            </Text>
            {[
              {
                title: "First Name",
                field: "firstName",
                placeholder: "type first name ...",
              },
              {
                title: "Last Name",
                field: "lastName",
                placeholder: "type last name ...",
              },
              {
                title: "Username",
                field: "username",
                placeholder: "type username ...",
              },
              {
                title: "Email",
                field: "email",
                placeholder: "type email ...",
              },
              {
                title: "Password",
                field: "password",
                placeholder: "type password ...",
                onFocus: () => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({
                      y: 350,
                      animated: true,
                    });
                  }, 100);
                },
              },
            ].map(({ title, field, placeholder, onFocus, onBlur }) => (
              <View key={field}>
                <FormField
                  title={title}
                  value={form[field]}
                  handleChangeText={(e) => handleChangeText(field, e)}
                  otherStyles="mx-6"
                  placeholder={placeholder}
                  onFocus={onFocus}
                  onBlur={onBlur}
                />
                {errors[field] && (
                  <Text className="mx-6 text-red-600 text-sm">
                    {errors[field]}
                  </Text>
                )}
              </View>
            ))}
            <View className="mx-6 mt-4 mb-4">
              <Text style={{ fontSize: 16, marginBottom: 8, color: "#b3b3b3" }}>
                City
              </Text>
              <SelectList
                setSelected={(val) => setCity(val)}
                data={citiesList}
                save="value"
                placeholder="select a city"
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 450, animated: true });
                  }, 100);
                }}
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
            <CustomButton
              title="Sign Up"
              handlePress={submit}
              containerStyles="mx-6"
              isLoading={isSubmiting}
              textStyles="text-white px-2 p-2"
            />

            <View className="justify-center flex-row gap-2 ">
              <Text
                className="text-lg font-pregular"
                style={{ color: "#b3b3b3" }}>
                Have an account already?
              </Text>
              <Link
                href="/sign-in"
                className="text-lg font-psemibold"
                style={{ color: "#757575" }}>
                Sign in
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUp;
