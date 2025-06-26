import { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, ActivityIndicator, Alert } from "react-native";
import axios from "axios";
import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";
import config from "../constants/config";

const SearchInput = ({ searchType, placeholder, onSearchResults }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [results, setResults] = useState([]);
  const [loggedUserId, setLoggedUserId] = useState("");

  const handleSearchResults = useCallback(
    (data) => {
      onSearchResults(data);
    },
    [onSearchResults]
  );

  const getLoggedUserId = async () => {
    try {
      const loggedUserId = await AsyncStorage.getItem("loggedUserId");
      if (loggedUserId) {
        setLoggedUserId(loggedUserId);
      }
      return null;
    } catch (error) {
      console.error("Error retrieving loggedUserId:", error);
    }
  };

  useEffect(() => {
    let debounceTimeout;
    getLoggedUserId();
    if (isTyping) {
      debounceTimeout = setTimeout(() => {
        if (query.trim() === "") {
          setResults([]);
          setLoading(false);
          setIsTyping(false);
          handleSearchResults([]);
          return;
        }

        const fetchResults = async () => {
          setLoading(true);
          try {
            const { status } =
              await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
              Alert.alert("Location permission denied");
              setLoading(false);
              return;
            }
            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            const response = await axios.get(
              `${config.SERVER_URL}/search${searchType}`,
              {
                params: {
                  query,
                  userId: loggedUserId,
                  lat: latitude,
                  lng: longitude,
                },
              }
            );
            const data = response.data.groups || [];
            handleSearchResults(data);
            setResults(data);
          } catch (error) {
            console.error("Error fetching results:", error);
          } finally {
            setLoading(false);
            setIsTyping(false);
          }
        };

        fetchResults();
      }, 500);
    }

    return () => clearTimeout(debounceTimeout);
  }, [query, searchType, handleSearchResults, isTyping]);

  const handleInputChange = (text) => {
    setQuery(text);
    setIsTyping(true);
  };

  const renderNoResultsMessage = () => {
    if (!isTyping || results.length > 0) return null;
    return (
      <Text className="mt-6" style={{ color: "#b3b3b3", fontWeight: "bold" }}>
        No groups found
      </Text>
    );
  };

  return (
    <View className="flex px-4 pt-2 ">
      <TextInput
        className="p-2 border rounded"
        placeholder={placeholder}
        value={query}
        onChangeText={handleInputChange}
      />
      <View className="items-center">
        <View className="pt-2">
          {loading && <ActivityIndicator size="small" color="#504357" />}
        </View>
        {renderNoResultsMessage()}
      </View>
    </View>
  );
};

export default SearchInput;
