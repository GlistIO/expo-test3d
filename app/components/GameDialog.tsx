import React, { useEffect, useRef } from "react";
import { View, Text, Image, ImageBackground, StyleSheet, Animated } from "react-native";
import { useFonts } from "expo-font";

export default function GameDialog({ visible, text, icon, timeout = 2200, onHide }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [fontsLoaded] = useFonts({
    "Dogica": require("../../assets/fonts/dogica.ttf"),
    "Dogica-Bold": require("../../assets/fonts/dogicabold.ttf"),
    "Dogica-Pixel": require("../../assets/fonts/dogicapixel.ttf"),
    "Dogica-Pixel-Bold": require("../../assets/fonts/dogicapixelbold.ttf"),
  });

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }).start();
      if (onHide) {
        const t = setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => onHide());
        }, timeout);
        return () => clearTimeout(t);
      }
    }
  }, [visible]);

  if (!fontsLoaded || !visible) return null;

  return (
    <Animated.View style={[styles.dialog, { opacity: fadeAnim }]}>
      <ImageBackground
        source={require("../../assets/dialog_bg.png")}
        style={styles.bg}
        imageStyle={styles.bgImage}
      >
        <View style={styles.content}>
          {icon &&
            <Image
              source={typeof icon === "string" ? { uri: icon } : icon}
              style={styles.img}
              resizeMode="contain"
            />
          }
          <Text style={[styles.text, { fontFamily: "Dogica-Pixel" }]}>{text}</Text>
        </View>
      </ImageBackground>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dialog: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
    elevation: 8,
  },
  bg: {
    minHeight: 66,
    minWidth: 180,
    paddingVertical: 14,
    paddingHorizontal: 22,
    justifyContent: "center",
  },
  bgImage: {
    resizeMode: "stretch", // lai bilde izstiepjas kā dialogs
    borderRadius: 20,
    opacity: 0.97,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  img: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  text: {
    fontSize: 16,
    color: "#000",
    flexShrink: 1,
  }
});
