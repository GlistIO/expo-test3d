import React from "react";
import { View, Text, Image } from "react-native";

export default function CoinCounter({ count }) {
  return (
    <View style={{
      position: "absolute",
      top: 24, left: 16,
      flexDirection: "row",
      alignItems: "center"
    }}>
      <Image source={require("../../assets/coin.png")} style={{ width: 32, height: 32, marginRight: 8 }} />
      <Text style={{ fontSize: 24, fontWeight: "bold", color: "#fff" }}>{count}</Text>
    </View>
  );
}
