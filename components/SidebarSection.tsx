// components/SidebarSection.tsx
import React, { useEffect, useRef, useState } from "react";
import {
    AccessibilityRole,
    Animated,
    LayoutChangeEvent,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";

type Props = {
  icon?: React.ReactNode;
  title: string;
  children?: React.ReactNode;
  /**
   * If `collapsed` is true the section is folded (closed).
   * If undefined it's uncontrolled — component will open by default.
   */
  collapsed?: boolean;
  onToggle?: () => void;
  style?: ViewStyle;
  /**
   * Accessibility role for the toggle button (optional)
   */
  toggleRole?: AccessibilityRole;
};

export default function SidebarSection({
  icon,
  title,
  children,
  collapsed = false,
  onToggle,
  style,
  toggleRole = "button",
}: Props) {
  // measured content height (set once after layout)
  const [contentHeight, setContentHeight] = useState<number>(0);

  // animation value 0 = closed, 1 = open
  const anim = useRef(new Animated.Value(collapsed ? 0 : 1)).current;

  // keep an internal "isCollapsed" to respond to prop changes
  const prevCollapsedRef = useRef<boolean>(collapsed);

  useEffect(() => {
    // if prop changed, animate
    if (prevCollapsedRef.current !== collapsed) {
      animateTo(collapsed ? 0 : 1);
      prevCollapsedRef.current = collapsed;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collapsed]);

  const animateTo = (toValue: number) => {
    Animated.timing(anim, {
      toValue,
      duration: 180,
      useNativeDriver: false, // animating height requires nativeDriver false
    }).start();
  };

  const onContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    // save measured height once (if previously 0)
    if (h && contentHeight !== h) setContentHeight(h);
  };

  // interpolated height (0 .. contentHeight)
  const height = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight || 0],
  });

  // optional opacity for a nicer effect
  const opacity = anim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: [0, 0.3, 1],
  });

  return (
    <View style={[styles.wrapper, style]}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole={toggleRole}
        accessibilityState={{ expanded: !collapsed }}
        style={styles.header}
      >
        <View style={styles.iconWrap}>{icon}</View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <Text style={styles.caret}>{collapsed ? "▸" : "▾"}</Text>
      </TouchableOpacity>

      {/* Animated content container */}
      <Animated.View style={[styles.animatedContainer, { height, opacity }]}>
        {/* invisible (measured) container to get full height; the Animated.View's height will clamp it */}
        <View onLayout={onContentLayout} style={styles.content}>
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  header: {
    // sticky look / small header
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "transparent",
  },
  iconWrap: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    flex: 1,
  },
  caret: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  animatedContainer: {
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 6,
    paddingTop: 8,
    paddingBottom: 10,
  },
});
