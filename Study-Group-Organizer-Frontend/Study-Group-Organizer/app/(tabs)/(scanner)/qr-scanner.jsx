import { useState, useEffect, useRef } from "react";
import { Text, View, StyleSheet, Alert } from "react-native";
import { CameraView, Camera } from "expo-camera";
import CustomButton from "../../../components/CustomButton";
import { FullWindowOverlay } from "react-native-screens";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../../../constants/config";

function QRScanner() {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [loggedUser, setLoggedUser] = useState(null);
  const scanningInProgress = useRef(false);

  useEffect(() => {
    const getCameraPermissions = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };
    getLoggedUser();
    getCameraPermissions();
  }, []);

  const getLoggedUser = async () => {
    try {
      const loggedUser = await AsyncStorage.getItem("loggedUser");
      if (loggedUser) {
        setLoggedUser(loggedUser);
        return loggedUser;
      }
      return null;
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };

  const handleBarcodeScanned = async ({ type, data }) => {
    if (scanned || scanningInProgress.current) return;
    scanningInProgress.current = true;
    setScanned(true);
    setShowButton(false);

    try {
      const url = new URL(data);
      const token = url.searchParams.get("token");
      if (token) {
        const response = await fetch(`${config.SERVER_URL}/joinGroup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token, username: loggedUser }),
        });

        const result = await response.json();

        if (result.success) {
          Alert.alert("Success", "You have successfully joined the group!", [
            {
              text: "OK",
              onPress: () => setShowButton(true),
            },
          ]);
        } else {
          Alert.alert("Error", "Failed to join the group.", [
            {
              text: "OK",
              onPress: () => setShowButton(true),
            },
          ]);
        }
      } else {
        Alert.alert("Error", "Invalid QR for entering a group.", [
          {
            text: "OK",
            onPress: () => setShowButton(true),
          },
        ]);
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while trying to join the group.",
        [
          {
            text: "OK",
            onPress: () => setShowButton(true),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "pdf417"],
        }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.overlay}>
        <View style={styles.overlayTop} />
        <View style={styles.overlayCenterRow}>
          <View style={styles.overlaySide} />
          <View style={styles.overlayCutout} />
          <View style={styles.overlaySide} />
        </View>
        <View style={styles.overlayBottom} />
      </View>
      <FullWindowOverlay></FullWindowOverlay>
      {showButton && (
        <View style={styles.buttonContainer}>
          <CustomButton
            title={"Tap to scan again"}
            handlePress={() => {
              setScanned(false);
              setShowButton(false);
              scanningInProgress.current = false;
            }}
            containerStyles="m-6"
            textStyles=" px-2 p-2"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    justifyContent: "flex-end",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
  },
  overlayCenterRow: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlayCutout: {
    width: 250,
    height: 250,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "yellow",
    borderStyle: "dotted",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    width: "100%",
  },
});

export default QRScanner;
