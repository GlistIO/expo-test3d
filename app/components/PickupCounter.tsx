import React from "react";
import { View, Text, Image } from "react-native";

export default function PickupCounter({ pickupCounts = {}, imageUris = {} }) {
  // Only show types that have been collected (count > 0)
  const collectedTypes = Object.entries(pickupCounts).filter(([type, count]) => count > 0);
  
  if (collectedTypes.length === 0) {
    return null; // Don't show counter if nothing collected
  }

  return (
    <View style={{
      position: "absolute",
      top: 24, left: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      zIndex: 100,
    }}>
      {collectedTypes.map(([type, count]) => (
        <View
          key={type}
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginRight: 12,
            backgroundColor: "rgba(0,0,0,0.32)",
            borderRadius: 16,
            paddingHorizontal: 8,
            paddingVertical: 2,
          }}
        >
          <Image
            source={
              imageUris[type]
                ? { uri: imageUris[type] }
                : require("../../assets/coin.png") // fallback
            }
            style={{ width: 28, height: 28, marginRight: 6 }}
            resizeMode="contain"
          />
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>{count}</Text>
        </View>
      ))}
    </View>
  );
}
