import { StatusBar } from "expo-status-bar";
import { Stack } from "expo-router";

const CreateLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="my-groups" options={{ headerShown: false }} />
        <Stack.Screen name="create-group" options={{ headerShown: false }} />
        <Stack.Screen name="group-page" options={{ headerShown: false }} />
        <Stack.Screen name="create-session" options={{ headerShown: false }} />
        <Stack.Screen name="edit-group" options={{ headerShown: false }} />
        <Stack.Screen name="edit-session" options={{ headerShown: false }} />
        <Stack.Screen name="map" options={{ headerShown: false }} />
        <Stack.Screen name="task-board" options={{ headerShown: false }} />
        <Stack.Screen name="quiz-page" options={{ headerShown: false }} />
      </Stack>
      <StatusBar />
    </>
  );
};

export default CreateLayout;
