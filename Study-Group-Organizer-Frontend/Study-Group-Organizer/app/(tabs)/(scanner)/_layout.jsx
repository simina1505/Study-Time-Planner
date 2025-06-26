import { Stack } from "expo-router";

const ScannerLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen name="qr-scanner" options={{ headerShown: false }} />
      </Stack>
    </>
  );
};

export default ScannerLayout;
