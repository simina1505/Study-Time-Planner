import { View, Text, TextInput } from "react-native";
import React, { useState } from "react";
import { TouchableOpacity } from "react-native";
import FontAwesome from "@expo/vector-icons/FontAwesome";

const FormField = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  keyboardType,
  secureTextEntry,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className={`space-y-2 pt-2 ${otherStyles}`}>
      <Text className="text-base " style={{ color: "#b3b3b3" }}>
        {title}
      </Text>
      <View
        style={{ backgroundColor: "#e0d6e2", borderColor: "#7f6b89" }}
        className=" border-2 rounded-2xl w-full h-16 px-4 
             items-center flex-row ">
        <TextInput
          style={{ flex: 1, fontSize: 16, width: 350 }}
          value={value}
          placeholder={placeholder}
          placeholderTextColor="gray"
          onChangeText={handleChangeText}
          secureTextEntry={title === "Password" && !showPassword}
          keyboardType={keyboardType}
          onFocus={onFocus}
          onBlur={onBlur}
          {...restProps}
        />

        {title === "Password" && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text>
              {showPassword ? (
                <FontAwesome size={18} name="eye-slash" color="#504357" />
              ) : (
                <FontAwesome size={18} name="eye" color="#504357" />
              )}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default FormField;
