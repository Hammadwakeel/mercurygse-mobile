// components/Button.tsx
import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    ViewStyle,
} from "react-native";

type Variant = "default" | "outline";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = "default",
  loading = false,
  disabled,
  style,
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      style={[
        styles.base,
        variant === "outline" ? styles.outline : styles.filled,
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === "outline" ? "#f97316" : "#fff"} /> : <Text style={[styles.text, variant === "outline" && styles.textOutline]}>{title}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  filled: {
    backgroundColor: "#f97316", // orange
  },
  outline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  text: {
    color: "#ffffff",
    fontWeight: "700",
  },
  textOutline: {
    color: "#111827",
    fontWeight: "600",
  },
  disabled: {
    opacity: 0.6,
  },
});
