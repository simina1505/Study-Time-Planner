import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import CustomButton from "../../../components/CustomButton";
import { router, useFocusEffect } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import SearchInput from "../../../components/SearchInput";
import config from "../../../constants/config";

const MyGroups = () => {
  const [memberGroups, setMemberGroups] = useState([]);
  const [ownedGroups, setOwnedGroups] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loggedUser, setLoggedUser] = useState(null);

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

  const fetchGroups = async () => {
    try {
      const loggedUser = await getLoggedUser();
      await axios
        .get(`${config.SERVER_URL}/fetchOwnedGroups/${loggedUser}`)
        .then((response) => {
          setOwnedGroups(response.data.groups);
        })
        .catch((error) => {
          setOwnedGroups([]);
        });

      await axios
        .get(`${config.SERVER_URL}/fetchMemberGroups/${loggedUser}`)
        .then((response) => {
          setMemberGroups(response.data.groups);
        })
        .catch(() => {
          setMemberGroups([]);
        });
    } catch (error) {
      console.log("Error fetching groups:", error.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGroups();
    }, [])
  );

  const openCreateGroupForm = () => {
    router.push("/create-group");
  };

  const handleGroupPress = (groupId) => {
    router.push(`/group-page?groupId=${groupId}`);
  };

  const handleSearchResults = (results) => {
    setSearchResults(results);
  };

  const handleGroupModal = (group) => {
    setSelectedGroup(group);
    setModalVisible(true);
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const loggedUser = await getLoggedUser();
      await axios.post(`${config.SERVER_URL}/sendRequestToJoin`, {
        groupId,
        username: loggedUser,
      });
      setSelectedGroup((prevGroup) => ({
        ...prevGroup,
        requests: [...(prevGroup.requests || []), loggedUser],
      }));
      Alert.alert("Success", "You have requested to join the group.");
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Error", "Unable to join the group.");
      console.error("Error joining group:", error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    Alert.alert("Delete Group", "Are you sure you want to delete the group?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "OK",
        onPress: async () => {
          try {
            await axios.delete(`${config.SERVER_URL}/deleteGroup/${groupId}`);
            Alert.alert("Success", "Group deleted successfully.");
            fetchGroups();
          } catch (error) {
            console.error("Error deleting group:", error);
            Alert.alert("Error", "Failed to delete group.");
          }
        },
      },
    ]);
  };

  const handleLeaveGroup = async (groupId) => {
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
            fetchGroups();
          } catch (error) {
            console.error("Error leaving group:", error);
            Alert.alert("Error", "Failed to leave the group.");
          }
        },
      },
    ]);
  };

  const handleEditGroup = (groupId) => {
    router.push(`/edit-group?groupId=${groupId}`);
  };

  return (
    <SafeAreaView className="w-full min-h-[85vh] px-4 my-6">
      <View className="flex-row pb-3">
        <View style={{ width: 380 }}>
          <SearchInput
            searchType="Groups"
            placeholder="Search for groups in your city..."
            onSearchResults={handleSearchResults}
          />
        </View>
        {Platform.OS === "ios" && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push("/map")}
            style={{ paddingTop: 15 }}>
            <FontAwesome size={20} name="map" color="#504357" />
          </TouchableOpacity>
        )}
      </View>
      {searchResults?.length > 0 && (
        <FlatList
          className="mx-6 mb-6 h-40"
          data={searchResults}
          keyExtractor={(item) => item._id || item.id}
          renderItem={({ item }) => (
            <View style={styles.taskCard}>
              <View style={styles.cardHeader}>
                <Text
                  style={{ fontSize: 16, fontWeight: "bold", color: "#333" }}>
                  {item.name}
                </Text>
                <TouchableOpacity onPress={() => handleGroupModal(item)}>
                  <FontAwesome size={20} color="#504357" name="info-circle" />
                </TouchableOpacity>
              </View>
              <Text style={{ color: "#555", marginTop: 8 }}>
                {item.description}
              </Text>
            </View>
          )}
          style={{ marginTop: 16 }}
        />
      )}
      <ScrollView>
        <View className="w-full justify-center">
          <Text
            className="mx-3 mb-6"
            style={{ fontSize: 25, fontWeight: "bold" }}>
            My Groups
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {ownedGroups?.length > 0 &&
              ownedGroups.map((group) => (
                <View
                  className="flex-row"
                  style={{
                    marginHorizontal: 8,
                    backgroundColor: "black",
                    borderRadius: 12,
                    padding: 2,
                    height: 150,
                  }}
                  key={group._id}>
                  <TouchableOpacity
                    style={{
                      width: 200,
                      padding: 10,
                      backgroundColor: "#f0f0f0",
                      borderRadius: 8,
                    }}
                    onPress={() => handleGroupPress(group._id)}>
                    <View className="flex-row pb-6">
                      <Text className="text-xl font-bold mr-2">
                        {group.name}
                      </Text>
                      <View className="pt-1">
                        {group.privacy === "Private" ? (
                          <FontAwesome size={20} name="lock" />
                        ) : (
                          <FontAwesome size={20} name="unlock" />
                        )}
                      </View>
                    </View>
                    <Text className="text-gray-500">{group.description}</Text>
                    <View className="flex-row pt-6 ml-14 pl-14">
                      <TouchableOpacity
                        style={{ paddingRight: 10 }}
                        onPress={() => handleEditGroup(group._id)}>
                        <FontAwesome name="pencil" size={24} color="#504357" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteGroup(group._id)}>
                        <FontAwesome name="trash" size={24} color="#504357" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              ))}
          </ScrollView>
          <Text
            className="mx-3 mt-3 mb-6"
            style={{ fontSize: 25, fontWeight: "bold" }}>
            Member of
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {memberGroups?.length > 0 &&
              memberGroups.map((group) => (
                <View key={group._id}>
                  <View
                    className="flex-row"
                    style={{
                      marginHorizontal: 8,
                      backgroundColor: "black",
                      borderRadius: 12,
                      padding: 2,
                      height: 150,
                    }}>
                    <TouchableOpacity
                      style={{
                        width: 200,
                        padding: 10,
                        backgroundColor: "#f0f0f0",
                        borderRadius: 8,
                      }}
                      onPress={() => handleGroupPress(group._id)}>
                      <View className="flex-row pb-6">
                        <Text className="text-xl font-bold mr-2">
                          {group.name}
                        </Text>
                        <View className="pt-1">
                          {group.privacy === "Private" ? (
                            <FontAwesome size={20} name="lock" />
                          ) : (
                            <FontAwesome size={20} name="unlock" />
                          )}
                        </View>
                      </View>

                      <Text className="text-gray-500">{group.description}</Text>
                      <View className="pt-6 ml-14 pl-14">
                        <TouchableOpacity
                          style={{ paddingLeft: 35 }}
                          keyExtractor={(item) => item._id || item.id}
                          onPress={() => handleLeaveGroup(group._id)}>
                          <FontAwesome
                            name="sign-out"
                            size={24}
                            color="#504357"
                          />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </ScrollView>
          <View className="items-center">
            <CustomButton
              title="Create Group"
              handlePress={openCreateGroupForm}
              containerStyles="m-6 w-40"
              textStyles="text-white px-2 p-2"
            />
          </View>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 16,
              borderRadius: 12,
              width: "85%",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 5,
            }}>
            {selectedGroup && (
              <>
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: "#504357",
                    textAlign: "center",
                  }}>
                  {selectedGroup.name}
                </Text>

                <Text
                  style={{
                    marginTop: 8,
                    marginBottom: 12,
                    fontWeight: "500",
                    color: "#666",
                    fontSize: 14,
                    textAlign: "center",
                  }}>
                  {selectedGroup.description}
                </Text>

                {selectedGroup.subject?.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 8,
                      justifyContent: "center",
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: "bold",
                        color: "#333",
                      }}>
                      Subjects:{" "}
                    </Text>
                    {selectedGroup.subject.map((subject, index) => (
                      <Text
                        key={index}
                        style={{
                          color: "#555",
                          fontWeight: "500",
                          marginRight: 4,
                          fontSize: 13,
                          textTransform: "capitalize",
                        }}>
                        {subject}
                        {index !== selectedGroup.subject?.length - 1 && ","}
                      </Text>
                    ))}
                  </View>
                )}
                <View
                  style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 8,
                    justifyContent: "center",
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "#333",
                    }}>
                    City:{" "}
                  </Text>
                  <Text
                    style={{
                      color: "#555",
                      fontWeight: "500",
                      fontSize: 14,
                      marginBottom: 8,
                      textAlign: "center",
                      textTransform: "capitalize",
                    }}>
                    {selectedGroup.city}
                  </Text>
                </View>

                {selectedGroup.requests?.includes(loggedUser) && (
                  <Text
                    style={{
                      color: "#a3c2a0",
                      fontWeight: "bold",
                      fontSize: 13,
                      marginBottom: 8,
                      textAlign: "center",
                    }}>
                    Waiting for approval
                  </Text>
                )}

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    marginTop: 10,
                  }}>
                  {selectedGroup.creator !== loggedUser &&
                    !selectedGroup.members?.includes(loggedUser) &&
                    !selectedGroup.requests?.includes(loggedUser) && (
                      <CustomButton
                        title="Join Group"
                        handlePress={() => handleJoinGroup(selectedGroup._id)}
                        containerStyles="w-32 bg-[#a3c2a0]"
                        textStyles="text-white px-2 py-1 text-sm"
                      />
                    )}
                  <CustomButton
                    title="Close"
                    handlePress={() => setModalVisible(false)}
                    containerStyles="w-28 bg-[#504357]"
                    textStyles="text-white px-2 py-1 text-sm"
                  />
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  taskCard: {
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default MyGroups;
