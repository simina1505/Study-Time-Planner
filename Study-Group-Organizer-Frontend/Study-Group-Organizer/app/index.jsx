import { StatusBar } from "expo-status-bar";
import { ScrollView, Text, View, Image } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../components/CustomButton";
import React, { useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [loggedUser, setLoggedUser] = useState("");
  useFocusEffect(
    React.useCallback(() => {
      getLoggedUser();
    }, [])
  );

  const getLoggedUser = async () => {
    try {
      const loggedUser = await AsyncStorage.getItem("loggedUser");
      if (loggedUser) {
        setLoggedUser(loggedUser);
      }
      return null;
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };

  return (
    <SafeAreaView>
      <ScrollView
        contentContainerStyle={{
          height: "100%",
        }}>
        <View className="flex-1 items-center justify-center">
          <Image
            source={require("../assets/logo.png")}
            style={{
              width: 170,
              height: 170,
              resizeMode: "contain",
            }}
          />
          <Text style={{ fontSize: 40, fontWeight: "bold" }}>
            StudyPlan&Track
          </Text>

          <Text
            style={{
              fontSize: 24,
              fontWeight: "bold",
              color: "#555",
            }}>
            Find your study buddies
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontWeight: "bold",
              color: "#cccccc",
              marginBottom: 10,
            }}>
            plan your time & track the progress
          </Text>
          <CustomButton
            title="Click here to enter"
            handlePress={() =>
              loggedUser != ""
                ? router.push("/home-page")
                : router.push("/sign-in")
            }
            textStyles="text-white px-2 p-2"
            containerStyles={"mt-8"}></CustomButton>
        </View>
      </ScrollView>
      <StatusBar />
    </SafeAreaView>
  );
}
