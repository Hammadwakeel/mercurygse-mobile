// components/Label.tsx
import React from "react";
import { StyleSheet, Text } from "react-native";

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <Text style={styles.label}>{children}</Text>;
};

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
    color: "#374151",
  },
});
