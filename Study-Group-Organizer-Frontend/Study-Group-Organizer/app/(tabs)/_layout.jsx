import { Tabs, router } from "expo-router";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const TabsLayout = () => {
  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: "#504357",
          tabBarInactiveTintColor: "#7f6b89",
          tabBarStyle: { backgroundColor: "#c6bccb" },
        }}>
        <Tabs.Screen
          name="(home)"
          options={{
            title: "Home",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="home" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(groups)"
          options={{
            title: "Groups",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="group" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(scanner)"
          options={{
            title: "QR Scanner",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="qrcode" color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="(profile)"
          options={{
            title: "Profile",
            headerShown: false,
            tabBarIcon: ({ color }) => (
              <FontAwesome size={28} name="user" color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.push({
                pathname: "/(tabs)/(profile)/profile-page",
                params: { userId: null },
              });
            },
          }}
        />
      </Tabs>
    </>
  );
};

export default TabsLayout;
