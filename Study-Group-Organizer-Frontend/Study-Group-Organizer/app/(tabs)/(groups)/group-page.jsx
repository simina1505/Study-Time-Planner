import { useLocalSearchParams, router } from "expo-router";
import {
  Text,
  View,
  Alert,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  StyleSheet,
} from "react-native";
import React, { useState, useEffect, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import CustomButton from "../../../components/CustomButton";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "@react-navigation/native";
import * as FileSystem from "expo-file-system";
import { shareAsync } from "expo-sharing";
import config from "../../../constants/config";
import { KeyboardAvoidingView, Platform } from "react-native";
import { io } from "socket.io-client";

const GroupPage = () => {
  const { groupId } = useLocalSearchParams();
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [loggedUserId, setLoggedUserId] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageName, setSelectedImageName] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [requestsModalVisible, setModalVisible] = useState(false);
  const [sessionsModalVisible, setSessionsModalVisible] = useState(false);
  const [membersModalVisible, setMembersModalVisible] = useState(false);
  const [qrCodeModalVisible, setQRCodeModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);

  const flatListRef = React.useRef(null);
  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        await getLoggedUser();
        await fetchGroupData();
        await fetchSessions();
        await fetchMessagesAndFiles();
      };
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 200);
      fetchData();
    }, [groupId])
  );

  useEffect(() => {
    const newSocket = io(`${config.SERVER_URL}`);
    socketRef.current = newSocket;
    setSocket(newSocket);
    console.log("Socket initialized:", newSocket.id);

    newSocket.on("connect", () => {
      console.log("Connected to socket server");
      if (groupId && loggedUserId) {
        newSocket.emit("join_group", { groupId, userId: loggedUserId });
        newSocket.emit("user_active", { groupId, userId: loggedUserId });
      }
    });

    newSocket.on("receive_message", (message) => {
      console.log("New message received via socket:", message);

      if (message.user && message.user._id !== loggedUserId) {
        setMessages((prevMessages) => {
          const messageExists = prevMessages.some(
            (msg) => msg._id && msg._id.toString() === message._id?.toString()
          );

          if (messageExists) {
            return prevMessages;
          }

          const formattedMessage = {
            _id: message._id || generateUniqueId(),
            text: message.text,
            createdAt: new Date(message.timestamp || Date.now()),
            user: {
              _id: message.user._id,
              username: message.user.name || "Unknown User",
            },
            file: message.file
              ? {
                  url: message.file.url,
                  name: message.file.name,
                }
              : null,
          };

          const updatedMessages = [...prevMessages, formattedMessage].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          return updatedMessages;
        });
      }
    });

    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection");
        socketRef.current.emit("leave_group", groupId);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [groupId, loggedUserId]);

  const generateUniqueId = () => {
    return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const openCreateGroupForm = () => {
    router.push(`/create-session?groupId=${groupId}`);
  };

  const goToTaskBoardPage = () => {
    setDropdownVisible(false);
    router.push(`/task-board?groupId=${groupId}`);
  };

  const goToQuizPage = () => {
    setDropdownVisible(false);
    router.push(`/quiz-page?groupId=${groupId}`);
  };

  const getLoggedUser = async () => {
    try {
      const userId = await AsyncStorage.getItem("loggedUserId");
      const username = await AsyncStorage.getItem("loggedUser");
      if (userId) {
        setLoggedUserId(userId);
      }
      if (username) {
        setLoggedUser(username);
      }
    } catch (error) {
      console.error("Error retrieving loggedUserId:", error);
    }
  };

  const fetchMessagesAndFiles = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchMessagesandFiles/${groupId}`
      );
      if (response.data.success) {
        const allMessages = response.data.messages.map((msg) => ({
          _id: msg._id,
          text: msg.text,
          createdAt: new Date(msg.timestamp),
          user: {
            _id: msg.user._id,
            username: fetchUsername(msg.user._id),
          },
          file: msg.file ? msg.file : null,
        }));

        setMessages(
          allMessages.sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          )
        );
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      Alert.alert("Error", "Failed to load messages.");
    }
  };

  const formatForCalendar = (isoDate) => {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
      2,
      "0"
    )}`;
  };

  const onSend = useCallback(
    async (messagesArray = []) => {
      const message = messagesArray[0];
      if (message.text && message.text.trim() === "" && !message.file) {
        return;
      }

      try {
        if (message.file) {
          const formData = new FormData();
          formData.append("file", {
            uri: message.file.uri,
            name: message.file.name,
            type: message.file.mimeType || "application/octet-stream",
          });
          formData.append("senderId", loggedUserId);
          formData.append("groupId", groupId);

          Alert.alert("Uploading", "Starting file upload...");

          const response = await axios.post(
            `${config.SERVER_URL}/sendFile`,
            formData,
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );

          if (response.data.success) {
            const fileMessage = {
              _id: response.data.fileMessage._id || generateUniqueId(),
              text: `File: ${message.file.name}`,
              createdAt: new Date(),
              user: { _id: loggedUserId, username: loggedUser },
              file: {
                url: response.data.fileMessage.mediaUrl,
                name: message.file.name,
              },
            };

            setMessages((prevMessages) => [...prevMessages, fileMessage]);

            if (socketRef.current) {
              socketRef.current.emit("send_file", {
                senderId: loggedUserId,
                username: loggedUser,
                groupId,
                fileName: message.file.name,
                mediaUrl: response.data.fileMessage.mediaUrl,
                messageId: fileMessage._id,
                timestamp: new Date(),
              });
            }
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        } else if (message.text && message.text.trim()) {
          const textMessage = {
            _id: generateUniqueId(),
            text: message.text,
            createdAt: new Date(),
            user: { _id: loggedUserId, username: loggedUser },
          };

          await axios.post(`${config.SERVER_URL}/sendMessage`, {
            senderId: loggedUserId,
            groupId,
            content: message.text,
            timestamp: textMessage.createdAt.toISOString(),
            messageId: textMessage._id,
          });

          setMessages((prevMessages) => [...prevMessages, textMessage]);
          setMessageText("");

          if (socketRef.current) {
            socketRef.current.emit("send_message", {
              senderId: loggedUserId,
              groupId,
              content: message.text,
            });
          }

          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        if (message.file) {
          setMessages((prevMessages) =>
            prevMessages.filter((msg) => !msg.isUploading)
          );
        }
      }
    },
    [groupId, loggedUserId]
  );

  const handleFileSelect = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });

      if (!result.canceled) {
        const file = result.assets[0];

        if (!file) {
          console.error("No file selected");
          return;
        }

        const { uri, name, mimeType } = file;

        if (!uri || !name || !mimeType) {
          console.error("Missing file properties: ", { uri, name, mimeType });
          return;
        }

        const fileMessage = {
          _id: generateUniqueId(),
          text: `File: ${name}`,
          createdAt: new Date(),
          user: { _id: loggedUserId },
          file: { uri, name, mimeType },
        };

        onSend([fileMessage]);
      } else {
        console.log("File picker was canceled.");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const handleAccept = async (username) => {
    try {
      const response = await axios.post(`${config.SERVER_URL}/acceptRequest`, {
        groupId,
        username,
      });
      if (response.data.success) {
        const updatedRequests = selectedGroup.requests.filter(
          (request) => request !== username
        );
        const updatedGroup = { ...selectedGroup, requests: updatedRequests };

        setSelectedGroup(updatedGroup);
        Alert.alert("Success", `${username} added to group!`);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      Alert.alert("Error", "Failed to fetch group.");
    }
  };

  const handleDecline = async (username) => {
    try {
      const response = await axios.post(`${config.SERVER_URL}/declineRequest`, {
        groupId,
        username,
      });
      if (response.data.success) {
        const updatedRequests = selectedGroup.requests.filter(
          (request) => request !== username
        );
        const updatedGroup = { ...selectedGroup, requests: updatedRequests };

        setSelectedGroup(updatedGroup);
        Alert.alert("Success", `${username} removed from requests!`);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      Alert.alert("Error", "Failed to fetch group.");
    }
  };

  const selectAndUploadPhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        alert("Permission to access media library is required!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType,
        quality: 1,
      });

      if (!result.canceled) {
        const photo = result.assets[0];

        if (!photo) {
          console.error("No photo selected");
          return;
        }

        const { uri, mimeType } = photo;
        const name = `Photo - ${Date.now()}.png`;

        if (!uri || !mimeType) {
          console.error("Missing photo properties: ", { uri, name, mimeType });
          return;
        }

        const photoMessage = {
          _id: generateUniqueId(),
          text: name,
          createdAt: new Date(),
          user: { _id: loggedUserId },
          file: { uri, name, mimeType },
        };
        onSend([photoMessage]);
      } else {
        console.log("File picker was canceled.");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
    }
  };

  const openCamera = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access the camera is required!"
        );
        return;
      }

      const pickerResult = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!pickerResult.canceled) {
        const photo = pickerResult.assets[0];

        if (!photo) {
          console.error("No photo captured");
          return;
        }

        const { uri, mimeType } = photo;
        const name = `Photo - ${Date.now()}.png`;

        if (!uri || !mimeType) {
          console.error("Missing photo properties: ", { uri, name, mimeType });
          return;
        }

        const photoMessage = {
          _id: generateUniqueId(),
          text: name,
          createdAt: new Date(),
          user: { _id: loggedUserId },
          file: { uri, name, mimeType },
        };

        onSend([photoMessage]);
      } else {
        console.log("Camera was canceled.");
      }
    } catch (error) {
      console.error("Error using camera:", error);
    }
  };

  const downloadFile = async (fileUrl, filename) => {
    try {
      const result = await FileSystem.downloadAsync(
        fileUrl,
        FileSystem.documentDirectory + filename
      );
      await shareAsync(result.uri);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const openImageModal = (imageUrl, name) => {
    setSelectedImage(imageUrl);
    setSelectedImageName(name);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const fetchGroupData = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchGroup/${groupId}`
      );
      if (response.data.success) {
        setSelectedGroup(response.data.group);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
      Alert.alert("Error", "Failed to fetch group.");
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/fetchSessions/${groupId}`
      );
      if (response.data.success) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      Alert.alert("Error", "Failed to fetch sessions.");
    }
  };

  const openRequestsModal = async () => {
    if (selectedGroup) {
      setModalVisible(true);
    }
  };

  const openSessionsModal = async () => {
    if (sessions) {
      setDropdownVisible(false);
      setSessionsModalVisible(true);
    }
  };

  const openMembersModal = async () => {
    if (selectedGroup?.members) {
      setDropdownVisible(false);
      setMembersModalVisible(true);
    }
  };

  const generateQRCode = async () => {
    try {
      const username = loggedUser;
      const response = await axios.post(
        `${config.SERVER_URL}/generateGroupQRCode`,
        {
          groupId,
          username,
        }
      );
      if (response.data.success) {
        setQrCodeData(response.data.qrCode);
      } else {
        console.error("Failed to generate QR code:", response.data.message);
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  };

  const openQRCodeModal = async () => {
    setQRCodeModalVisible(true);
    await generateQRCode();
  };

  const closeQRCodeModal = () => {
    setQRCodeModalVisible(false);
  };

  const handleDeleteSession = async (sessionId) => {
    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete the session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              await axios.delete(
                `${config.SERVER_URL}/deleteSession/${sessionId}`
              );
              Alert.alert("Success", "Session deleted successfully.");
              fetchSessions();
              fetchGroupData();
            } catch (error) {
              console.error("Error deleting session:", error);
              Alert.alert("Error", "Failed to delete session.");
            }
          },
        },
      ]
    );
  };

  const handleEditSession = (sessionId) => {
    setSessionsModalVisible(false);
    router.push(`/edit-session?sessionId=${sessionId}`);
  };

  const fetchUsername = async (userId) => {
    try {
      const response = await axios.get(
        `${config.SERVER_URL}/getUsernameById/${userId}`
      );
      if (response.data.success) {
        return response.data.username;
      } else {
        console.error("Error fetching username:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching username:", error);
    }
  };

  const goToUserProfile = async (username) => {
    const response = await axios.get(
      `${config.SERVER_URL}/getUserByUsername/${username}`
    );
    const userId = response.data.user._id;
    router.push(`/profile-page?userId=${userId}`);
    setMembersModalVisible(false);
  };

  const handleLeaveSession = async (sessionId) => {
    Alert.alert(
      "Leave Session",
      "Are you sure you want to leave the session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${config.SERVER_URL}/leaveSession/${sessionId}`,
                { username: loggedUser }
              );

              if (response.data.success) {
                Alert.alert("Success", response.data.message);
                fetchSessions();
                fetchGroupData();
              } else {
                Alert.alert("Error", response.data.message);
              }
            } catch (error) {
              console.error("Error leaving session:", error);
              Alert.alert("Error", "Failed to leave the session.");
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = async (groupId) => {
    setDropdownVisible(false);
    Alert.alert("Leave Group", "Are you sure you want to leave the group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.post(`${config.SERVER_URL}/leaveGroup`, {
              groupId,
              username: loggedUser,
            });
            Alert.alert("Success", "You have left the group.");
            router.push("/groups");
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave the group.");
          }
        },
      },
    ]);
  };

  const handleRejoinSession = async (sessionId) => {
    Alert.alert(
      "Rejoin Session",
      "Are you sure you want to rejoin the session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "OK",
          onPress: async () => {
            try {
              const response = await axios.post(
                `${config.SERVER_URL}/rejoinSession/${sessionId}`,
                { username: loggedUser }
              );

              if (response.data.success) {
                Alert.alert("Success", response.data.message);
                fetchSessions();
                fetchGroupData();
              } else {
                Alert.alert("Error", response.data.message);
              }
            } catch (error) {
              console.error("Error rejoining session:", error);
              Alert.alert("Error", "Failed to rejoin the session.");
            }
          },
        },
      ]
    );
  };

  const renderActions = () => (
    <View className="flex-row">
      <View>
        <TouchableOpacity onPress={handleFileSelect} style={{ margin: 10 }}>
          <Text style={{ color: "#504357" }}>
            <FontAwesome size={25} name="paperclip" />
          </Text>
        </TouchableOpacity>
      </View>
      <View>
        {
          <TouchableOpacity
            onPress={selectAndUploadPhoto}
            style={{ margin: 10 }}>
            <Text style={{ color: "#504357" }}>
              <FontAwesome size={25} name="photo" />
            </Text>
          </TouchableOpacity>
        }
      </View>
      <View>
        <TouchableOpacity onPress={openCamera} style={{ margin: 10 }}>
          <Text style={{ color: "#504357" }}>
            <FontAwesome size={25} name="camera" />
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAllMessages = (props) => {
    const { currentMessage } = props;
    const isMyMessage = currentMessage.user._id === loggedUserId;

    const messageStyle = {
      marginRight: isMyMessage ? 10 : 0,
      marginLeft: isMyMessage ? 0 : 10,
      color: "white",
      backgroundColor: isMyMessage ? "#a3c2a0" : "#7f6b89",
      padding: 10,
      borderRadius: 8,
      marginBottom: 5,
      alignSelf: isMyMessage ? "flex-end" : "flex-start",
      maxWidth: "80%",
    };

    const userStyle = {
      fontWeight: "bold",
      fontSize: 14,
      marginBottom: 5,
      paddingLeft: 5,
      marginLeft: 10,
      marginTop: 10,
      alignSelf: isMyMessage ? "flex-end" : "flex-start",
    };

    if (currentMessage.file) {
      const { name, url } = currentMessage.file;
      const isImage =
        name.toLowerCase().endsWith(".png") ||
        name.toLowerCase().endsWith(".jpeg") ||
        name.toLowerCase().endsWith(".jpg") ||
        name.toLowerCase().endsWith(".gif");

      if (isImage) {
        return (
          <View>
            {!isMyMessage && (
              <View style={userStyle}>
                <Text style={{ color: "gray" }}>
                  {currentMessage.user.username || "User"}
                </Text>
              </View>
            )}
            <TouchableOpacity onPress={() => openImageModal(url, name)}>
              <View style={messageStyle}>
                <Image
                  source={{
                    uri: url,
                  }}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 10,
                    marginBottom: 5,
                    alignSelf: isMyMessage ? "flex-end" : "flex-start",
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: "white",
                    alignSelf: isMyMessage ? "flex-end" : "flex-start",
                    marginTop: 8,
                  }}>
                  {new Date(currentMessage.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      } else {
        return (
          <View>
            {!isMyMessage && (
              <View style={userStyle}>
                <Text style={{ color: "gray" }}>
                  {currentMessage.user.username || "User"}
                </Text>
              </View>
            )}
            <View style={messageStyle}>
              <TouchableOpacity onPress={() => downloadFile(url, name)}>
                <Text
                  style={{ textDecorationLine: "underline", color: "white" }}>
                  {name}
                </Text>
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 10,
                  color: "white",
                  alignSelf: isMyMessage ? "flex-end" : "flex-start",
                  marginTop: 8,
                }}>
                {new Date(currentMessage.createdAt).toLocaleString("en-US", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </Text>
            </View>
          </View>
        );
      }
    }

    return (
      <View>
        {!isMyMessage && (
          <View style={userStyle}>
            <Text style={{ color: "gray" }}>
              {currentMessage.user.username || " User"}
            </Text>
          </View>
        )}
        <View style={messageStyle}>
          <Text style={{ color: "white" }}>{currentMessage.text}</Text>
          <Text
            style={{
              fontSize: 10,
              color: "white",
              alignSelf: isMyMessage ? "flex-end" : "flex-start",
              marginTop: 8,
            }}>
            {new Date(currentMessage.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, marginTop: 40 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}>
        <Text
          style={{
            textAlign: "center",
            marginVertical: 10,
            fontSize: 24,
            fontWeight: "bold",
          }}>
          {selectedGroup?.name}{" "}
          {selectedGroup?.privacy === "Private" ? (
            <FontAwesome size={20} name="lock" />
          ) : (
            <FontAwesome size={20} name="unlock" />
          )}
        </Text>
        <TouchableOpacity
          onPress={() => setDropdownVisible(true)}
          style={{ position: "absolute", right: 10 }}>
          <FontAwesome name="ellipsis-v" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setDropdownVisible(false)}>
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "80%",
              alignItems: "center",
            }}>
            <Text
              style={{
                textAlign: "center",

                fontSize: 24,
                fontWeight: "bold",
              }}>
              More Actions
            </Text>
            <CustomButton
              title="Members"
              handlePress={openMembersModal}
              containerStyles="m-2 w-40"
              textStyles="text-white px-2 p-2"
            />
            <CustomButton
              title="Sessions"
              handlePress={openSessionsModal}
              containerStyles="m-2 w-40"
              textStyles="text-white px-2 p-2"
            />
            <CustomButton
              title="Tasks"
              handlePress={goToTaskBoardPage}
              containerStyles="m-2 w-40"
              textStyles="text-white px-2 p-2"
            />
            <CustomButton
              title="Quiz"
              handlePress={goToQuizPage}
              containerStyles="m-2 w-40"
              textStyles="text-white px-2 p-2"
            />

            <TouchableOpacity onPress={() => handleLeaveGroup(groupId)}>
              <FontAwesome name="sign-out" size={30} color="#504357" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ alignItems: "center" }}>
        {selectedGroup?.creator === loggedUser && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
            <CustomButton
              title="Create Session"
              handlePress={openCreateGroupForm}
              containerStyles="m-2 w-40"
              textStyles="text-white px-2 p-2"
            />
            {selectedGroup.privacy === "Public" && (
              <CustomButton
                title="Requests"
                handlePress={openRequestsModal}
                containerStyles="m-2 w-40"
                textStyles="text-white px-2 p-2"
              />
            )}
            {selectedGroup.privacy === "Private" && (
              <CustomButton
                title="QR Code"
                handlePress={openQRCodeModal}
                containerStyles="m-2 w-20"
                textStyles="text-white px-2 p-2"
              />
            )}
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginTop: 20 }}>
        <FlatList
          data={messages.filter((msg) => msg && msg.user)}
          renderItem={({ item }) => renderAllMessages({ currentMessage: item })}
          keyExtractor={(item) => item._id}
          style={styles.messageList}
          keyboardShouldPersistTaps="handled"
          inverted={false}
          onLayout={() => {
            if (messages.length > 0) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ref={flatListRef}
        />

        <View style={styles.inputContainer}>
          {renderActions()}
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            style={styles.input}
          />
          <TouchableOpacity
            onPress={() => onSend([{ text: messageText }])}
            style={styles.sendButton}>
            <FontAwesome name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}>
          <TouchableOpacity
            onPress={closeImageModal}
            style={{ position: "absolute", top: 40, right: 20 }}>
            <FontAwesome size={30} name="close" color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => downloadFile(selectedImage, selectedImageName)}
            style={{ position: "absolute", top: 40, right: 60 }}>
            <FontAwesome name="cloud-download" size={30} color="white" />
          </TouchableOpacity>
          <Image
            source={{ uri: selectedImage }}
            style={{ width: "90%", height: "80%", resizeMode: "contain" }}
          />
        </View>
      </Modal>
      <Modal
        visible={requestsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          onPress={() => setModalVisible(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}>
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "80%",
              alignItems: "center",
            }}>
            <Text className="text-xl font-semibold mb-4">Requests</Text>
            {selectedGroup && selectedGroup.requests.length > 0 ? (
              <FlatList
                data={selectedGroup.requests}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <View style={styles.card}>
                    <Text style={styles.title}>{item}</Text>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={() => handleAccept(item)}
                        style={{
                          backgroundColor: "green",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 5,
                        }}>
                        <Text style={{ color: "white" }}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDecline(item)}
                        style={{
                          backgroundColor: "red",
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderRadius: 5,
                        }}>
                        <Text style={{ color: "white" }}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
                style={{ marginTop: 16, width: "100%" }}
              />
            ) : (
              <Text style={{ color: "#333" }}>No requests found.</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={qrCodeModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeQRCodeModal}>
        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
          }}>
          <TouchableOpacity
            onPress={closeQRCodeModal}
            style={{ position: "absolute", top: 40, right: 20 }}>
            <FontAwesome size={30} name="close" color="white" />
          </TouchableOpacity>
          <View>
            {qrCodeData ? (
              <Image
                source={{ uri: qrCodeData }}
                style={{ width: 200, height: 200 }}
              />
            ) : (
              <Text>Generating QR Code...</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      <Modal
        visible={sessionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSessionsModalVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setSessionsModalVisible(false)}>
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              width: "80%",
              alignItems: "center",
            }}>
            <Text className="text-xl font-semibold mb-4">Sessions</Text>

            {sessions && sessions.length > 0 ? (
              <FlatList
                data={sessions}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View
                    style={styles.card}
                    className="flex-row justify-between items-center mb-4">
                    <Text style={styles.title}>{item.name.slice(0, 5)}</Text>
                    <Text>
                      {formatForCalendar(item.startDate)} {item.startTime}
                    </Text>
                    <View className="flex-row flex-row space-x-1">
                      {selectedGroup?.creator === loggedUser && (
                        <View className="flex-row flex-row space-x-1">
                          <TouchableOpacity
                            onPress={() => handleEditSession(item._id)}>
                            <FontAwesome
                              name="pencil"
                              size={24}
                              color="#504357"
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleDeleteSession(item._id)}>
                            <FontAwesome name="trash" size={24} color="red" />
                          </TouchableOpacity>
                        </View>
                      )}

                      {item.acceptedBy &&
                        item.acceptedBy.includes(loggedUser) && (
                          <TouchableOpacity
                            onPress={() => handleLeaveSession(item._id)}>
                            <FontAwesome
                              name="sign-out"
                              size={24}
                              color="#504357"
                            />
                          </TouchableOpacity>
                        )}
                      {item.acceptedBy &&
                        !item.acceptedBy.includes(loggedUser) && (
                          <TouchableOpacity
                            onPress={() => handleRejoinSession(item._id)}>
                            <FontAwesome
                              name="plus-circle"
                              size={24}
                              color="#504357"
                            />
                          </TouchableOpacity>
                        )}
                    </View>
                  </View>
                )}
              />
            ) : (
              <Text style={{ color: "#333" }}>There are no sessions.</Text>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={membersModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMembersModalVisible(false)}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
          }}
          onPress={() => setMembersModalVisible(false)}>
          <View className="bg-white w-80 p-4 rounded">
            <Text className="text-xl font-semibold mb-4">Admin</Text>
            <TouchableOpacity
              onPress={() => goToUserProfile(selectedGroup?.creator)}>
              <View style={styles.card}>
                <Text style={styles.title}>{selectedGroup?.creator}</Text>
                <FontAwesome name="info-circle" size={24} color="#504357" />
              </View>
            </TouchableOpacity>
            <Text className="text-xl font-semibold mb-4">Members</Text>
            <View>
              {selectedGroup?.members?.length > 0 ? (
                <FlatList
                  data={selectedGroup?.members}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => goToUserProfile(item)}>
                      <View style={styles.card}>
                        <Text style={styles.title}>{item}</Text>
                        <FontAwesome
                          name="info-circle"
                          size={24}
                          color="#504357"
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                />
              ) : (
                <View style={{ alignItems: "center" }}>
                  <Text style={{ color: "#333" }}>No members found.</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f4f4f4" },
  card: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 5,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "bold" },
  messageContainer: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#504357",
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#7f6b89",
  },
  messageText: {
    color: "white",
    fontSize: 16,
  },
  messageTime: {
    color: "lightgray",
    fontSize: 12,
    marginTop: 5,
    alignSelf: "flex-end",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: "#504357",
    padding: 10,
    borderRadius: 20,
  },
});

export default GroupPage;
