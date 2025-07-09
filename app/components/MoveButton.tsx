import React, { useRef } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

export default function MoveButton({ direction, onMove, children }) {
  const intervalRef = useRef(null);

  function handlePressIn() {
    onMove(direction);
    intervalRef.current = setInterval(() => onMove(direction), 100);
  }
  function handlePressOut() {
    clearInterval(intervalRef.current);
  }

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={styles.button}>
      <Text style={styles.buttonText}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#ddd",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 52,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: "bold",
  },
});
