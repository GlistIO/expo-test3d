import React from "react";
import { View, Text, Image } from "react-native";

// pickupCounts: { coin: 2, key: 1, ... }
// imageUris: { coin: "...", key: "...", ... }

export default function PickupCounter({ pickupCounts = {}, imageUris = {} }) {
  return (
    <View style={{
      position: "absolute",
      top: 24, left: 16,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      zIndex: 100,
    }}>
      {Object.entries(pickupCounts).map(([type, count]) => (
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
                : require("../../assets/coin.png")
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
