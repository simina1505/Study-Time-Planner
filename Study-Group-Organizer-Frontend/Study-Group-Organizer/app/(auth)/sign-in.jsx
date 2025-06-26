import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  Alert,
  TouchableOpacity,
  Modal,
} from "react-native";
import FormField from "../../components/FormField";
import { useState } from "react";
import CustomButton from "../../components/CustomButton";
import { Link, router } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../constants/config";

const SignIn = () => {
  const [isSubmiting, setIsSubmiting] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [visible, setVisible] = useState(false);
  const [resetStep, setResetStep] = useState(1);

  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

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

  const submit = () => {
    if (!form.email || !form.password) {
      Alert.alert("Error", "Please fill in all the fields");
    }
    setIsSubmiting(true);

    const user = {
      email: form.email,
      password: form.password,
    };
    axios
      .post(`${config.SERVER_URL}/signIn`, user, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {
        if (response.status === 200 || response.status === 201) {
          const loggedUser = response.data.username;
          await AsyncStorage.setItem("loggedUser", loggedUser);
          await AsyncStorage.setItem("loggedUserId", response.data.userId);
          Alert.alert("Success", "Logged in successfully");
          router.replace("/home-page");
        } else {
          Alert.alert("email or password incorrect. Try again");
        }
      })
      .catch((error) => {
        console.log("sign in error:", error);
        Alert.alert(
          "Invalid email or password. Please try again or create a new account! Check if the email is verified"
        );
      });
    setIsSubmiting(false);
  };

  const sendResetCode = async () => {
    if (!resetEmail) return Alert.alert("Error", "Email is required");
    setIsSubmiting(true);

    try {
      await axios.post(`${config.SERVER_URL}/sendResetCode`, {
        email: resetEmail,
      });
      Alert.alert("Success", "A reset code has been sent to your email");
      setResetStep(2);
    } catch (err) {
      Alert.alert("Error", "Failed to send code. Please try again.");
    }
    setIsSubmiting(false);
  };

  const handleNewPasswordChange = (value) => {
    setNewPassword(value);
    const error = validatePassword(value);
    setPasswordError(error);
  };

  const resetPassword = async () => {
    if (!resetCode || !newPassword)
      return Alert.alert("Error", "Fill in all fields");

    const error = validatePassword(newPassword);
    if (error) {
      setPasswordError(error);
      return;
    }

    setIsSubmiting(true);
    try {
      await axios.post(`${config.SERVER_URL}/resetPassword`, {
        email: resetEmail,
        code: resetCode,
        newPassword,
      });
      Alert.alert("Success", "Password reset successfully");
      setVisible(false);
      setResetEmail("");
      setResetCode("");
      setNewPassword("");
      setResetStep(1);
    } catch (err) {
      Alert.alert("Error", err.response?.data?.message || "Reset failed");
    }
    setIsSubmiting(false);
  };

  return (
    <SafeAreaView className=" h-full">
      <ScrollView>
        <View className="w-full justify-center min-h-[85vh] px-4 my-6 ">
          <Text
            className="mx-6 mb-6"
            style={{ fontSize: 40, fontWeight: "bold" }}>
            Sign in
          </Text>
          <FormField
            title="Email"
            value={form.email}
            handleChangeText={(e) => setForm({ ...form, email: e })}
            otherStyles="mx-6"
            keyboardType="email-address"
            placeholder="type email"
          />
          <FormField
            title="Password"
            value={form.password}
            handleChangeText={(e) => setForm({ ...form, password: e })}
            otherStyles="mx-6"
            placeholder="type password"
          />
          <CustomButton
            title="Sign In"
            handlePress={submit}
            containerStyles="m-6"
            isLoading={isSubmiting}
            textStyles="text-white px-2 p-2"
          />
          <View className="justify-center flex-row gap-2 ">
            <Text
              className="text-lg font-pregular"
              style={{ color: "#b3b3b3" }}>
              Don't have an account?
            </Text>
            <Link
              href="/sign-up"
              className="text-lg font-psemibold"
              style={{ color: "#757575" }}>
              Sign up
            </Link>
          </View>
          <TouchableOpacity onPress={() => setVisible(true)}>
            <Text
              className="ml-12 text-s font-psemibold"
              style={{ color: "#757575" }}>
              Forgot Password? Click here to reset it.
            </Text>
          </TouchableOpacity>
        </View>
        <Modal visible={visible} transparent animationType="slide">
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: "#000000aa",
            }}>
            <View
              style={{
                margin: 30,
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
              }}>
              {resetStep === 1 ? (
                <>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      marginBottom: 16,
                    }}>
                    Enter Email
                  </Text>
                  <FormField
                    title="Email"
                    value={resetEmail}
                    handleChangeText={setResetEmail}
                    otherStyles="mx-2 mb-4"
                    placeholder={"Enter your email"}
                    keyboardType="email-address"
                  />
                  <CustomButton
                    title="Send Code"
                    handlePress={sendResetCode}
                    isLoading={isSubmiting}
                    containerStyles="m-2"
                    textStyles="text-white px-2 p-2"
                  />
                </>
              ) : (
                <>
                  <Text
                    style={{
                      fontSize: 24,
                      fontWeight: "bold",
                      marginBottom: 16,
                    }}>
                    Enter Code and New Password
                  </Text>
                  <FormField
                    title="Code"
                    value={resetCode}
                    handleChangeText={setResetCode}
                    otherStyles="mx-2 mb-2"
                    placeholder="Enter code"
                    keyboardType="numeric"
                  />
                  <FormField
                    title="New Password"
                    value={newPassword}
                    handleChangeText={setNewPassword}
                    otherStyles="mx-2 mb-4"
                    placeholder="Enter new password"
                    secureTextEntry
                  />
                  {passwordError ? (
                    <Text className="mx-2 text-red-600 text-sm mb-4">
                      {passwordError}
                    </Text>
                  ) : null}
                  <CustomButton
                    title="Reset Password"
                    handlePress={resetPassword}
                    isLoading={isSubmiting}
                    containerStyles="m-2"
                    textStyles="text-white px-2 p-2"
                  />
                </>
              )}

              <CustomButton
                title="Cancel"
                handlePress={() => {
                  setVisible(false);
                  setResetStep(1);
                  setResetEmail("");
                  setResetCode("");
                  setNewPassword("");
                }}
                containerStyles="m-2"
                textStyles="text-white px-2 p-2"
              />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SignIn;
