import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text, Alert, StyleSheet } from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import axios from "axios";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import config from "../../../constants/config";

const Map = () => {
  const [loggedUser, setLoggedUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [cityCoords, setCityCoords] = useState(null);
  const [loading, setLoading] = useState(true);

  const getLoggedUser = async () => {
    try {
      const loggedUser = await AsyncStorage.getItem("loggedUser");
      if (loggedUser) {
        setLoggedUser(loggedUser);
      }
    } catch (error) {
      console.error("Error retrieving loggedUser:", error);
    }
  };
  useEffect(() => {
    const fetchData = async () => {
      try {
        await getLoggedUser();
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Location permission denied");
          return;
        }
        const location = await Location.getCurrentPositionAsync({});
        setCityCoords(location.coords);
        await axios
          .get(`${config.SERVER_URL}/fetchGroups`)
          .then((response) => {
            setGroups(response.data.groups);
          })
          .catch((error) => {
            setGroups();
          });
      } catch (error) {
        console.error("Eroare la încărcarea datelor:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMarkerPress = (group) => {
    if (group.creator === loggedUser || group.members.includes(loggedUser)) {
      router.push(`/group-page?groupId=${group._id}`);
    } else {
      if (
        group.creator != loggedUser &&
        !group.members?.includes(loggedUser) &&
        !group.requests?.includes(loggedUser)
      ) {
        handleJoinGroup(group._id);
      }
    }
  };

  const getMarkerCoordinates = (groups, currentGroup, index) => {
    const baseLatitude = currentGroup.location.coordinates[1];
    const baseLongitude = currentGroup.location.coordinates[0];

    const sameLocationGroups = groups.filter(
      (group) =>
        Math.abs(group.location.coordinates[1] - baseLatitude) < 0.0001 &&
        Math.abs(group.location.coordinates[0] - baseLongitude) < 0.0001
    );

    if (sameLocationGroups.length <= 1) {
      return { latitude: baseLatitude, longitude: baseLongitude };
    }

    const groupIndex = sameLocationGroups.findIndex(
      (group) => group._id === currentGroup._id
    );

    const offsetDistance = 0.01;
    const angle = (groupIndex * 2 * Math.PI) / sameLocationGroups.length;

    return {
      latitude: baseLatitude + offsetDistance * Math.cos(angle),
      longitude: baseLongitude + offsetDistance * Math.sin(angle),
    };
  };

  const handleJoinGroup = async (groupId) => {
    try {
      await axios.post(`${config.SERVER_URL}/sendRequestToJoin`, {
        groupId,
        username: loggedUser,
      });
      setGroups((prevGroups) =>
        prevGroups.map((group) =>
          group._id === groupId
            ? {
                ...group,
                requests: [...(group.requests || []), loggedUser],
              }
            : group
        )
      );
      Alert.alert("Success", "You have requested to join the group.");
    } catch (error) {
      Alert.alert("Error", "Unable to join the group.");
      console.error("Error joining group:", error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="blue" />;
  }

  return (
    <View style={{ flex: 1 }}>
      {cityCoords && (
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: cityCoords.latitude,
            longitude: cityCoords.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
        >
          {groups.map((group, index) => {
            let pinColor = styles.notMemberColor.backgroundColor;

            if (group.creator === loggedUser) {
              pinColor = styles.adminColor.backgroundColor;
            } else if (group.members.includes(loggedUser)) {
              pinColor = styles.memberColor.backgroundColor;
            }
            const coordinates = getMarkerCoordinates(groups, group, index);
            return (
              <Marker
                key={group._id}
                coordinate={coordinates}
                title={group.name}
                description={group.subject}
                pinColor={pinColor}
              >
                <Callout onPress={() => handleMarkerPress(group)}>
                  <View
                    style={{
                      backgroundColor: "#f9f9f9",
                      borderRadius: 10,
                      padding: 12,
                      marginVertical: 8,
                      marginHorizontal: 16,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.08,
                      shadowRadius: 2,
                      elevation: 2,
                      minWidth: 200,
                    }}
                  >
                    <View className="items-center">
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: "bold",
                          color: "#504357",
                          textAlign: "center",
                        }}
                      >
                        {group.name}
                      </Text>
                      <Text
                        style={{
                          marginTop: 4,
                          marginBottom: 8,
                          fontWeight: "500",
                          color: "#666",
                          textAlign: "center",
                          fontSize: 13,
                        }}
                      >
                        {group.description}
                      </Text>
                    </View>

                    {group.subject?.length > 0 && (
                      <View
                        style={{
                          flexDirection: "row",
                          flexWrap: "wrap",
                          marginBottom: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          Subjects:{" "}
                        </Text>
                        {group.subject.map((subject, index) => (
                          <Text
                            key={index}
                            style={{
                              color: "#555",
                              fontWeight: "500",
                              marginRight: 4,
                              textTransform: "capitalize",
                              fontSize: 13,
                            }}
                          >
                            {subject}
                            {index !== group.subject.length - 1 && ","}{" "}
                          </Text>
                        ))}
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        marginBottom: 4,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "bold",
                          color: "#333",
                        }}
                      >
                        City:{" "}
                      </Text>
                      <Text
                        style={{
                          fontWeight: "500",
                          color: "#555",
                          textTransform: "capitalize",
                          fontSize: 13,
                        }}
                      >
                        {group.city}
                      </Text>
                    </View>
                    <View className="items-center">
                      {group.requests?.includes(loggedUser) && (
                        <Text
                          style={{
                            color: "#a3c2a0",
                            marginTop: 4,
                            fontWeight: "bold",
                            fontSize: 13,
                          }}
                        >
                          Waiting for approval
                        </Text>
                      )}
                    </View>
                    <View className="items-center" style={{ marginTop: 12 }}>
                      {(group.creator === loggedUser ||
                        group.members.includes(loggedUser)) && (
                        <Text
                          style={{
                            color: "#504357",
                            fontWeight: "bold",
                            paddingVertical: 4,
                            fontSize: 14,
                          }}
                        >
                          Go to group
                        </Text>
                      )}

                      {group.creator !== loggedUser &&
                        !group.members?.includes(loggedUser) &&
                        !group.requests?.includes(loggedUser) && (
                          <Text
                            style={{
                              color: "#504357",
                              fontWeight: "bold",
                              paddingVertical: 4,
                              fontSize: 14,
                            }}
                          >
                            Join group
                          </Text>
                        )}
                    </View>
                  </View>
                </Callout>
              </Marker>
            );
          })}
        </MapView>
      )}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Legend:</Text>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: styles.adminColor.backgroundColor },
            ]}
          />
          <Text style={styles.legendLabel}>Admin</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: styles.memberColor.backgroundColor },
            ]}
          />
          <Text style={styles.legendLabel}>Member</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: styles.notMemberColor.backgroundColor },
            ]}
          />
          <Text style={styles.legendLabel}>Not member</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  legendContainer: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    padding: 10,
    borderRadius: 5,
    zIndex: 1000,
    width: 150,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  legendColor: {
    width: 20,
    height: 20,
    marginRight: 10,
    borderRadius: 5,
  },
  adminColor: {
    backgroundColor: "#84c7c1",
  },
  memberColor: {
    backgroundColor: "#b8aecd",
  },
  notMemberColor: {
    backgroundColor: "#b8b8b8",
  },
  legendLabel: {
    fontSize: 14,
  },
});

export default Map;
