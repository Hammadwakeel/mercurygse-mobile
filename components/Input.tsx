// components/Input.tsx
import React from "react";
import { StyleSheet, TextInput, TextInputProps } from "react-native";

export const Input: React.FC<TextInputProps> = (props) => {
  return <TextInput style={styles.input} placeholderTextColor="#9ca3af" {...props} />;
};

const styles = StyleSheet.create({
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontSize: 16,
    color: "#111827",
  },
});
