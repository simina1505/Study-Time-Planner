import { Stack } from "expo-router";

const ProfileLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="profile-page" options={{ headerShown: false }} />
    </Stack>
  );
};

export default ProfileLayout;
