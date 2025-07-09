import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

// Funkcija, kas pārvieto spēlētāju (to izsauksi no pogām)
function movePlayer(direction) {
  // Šeit ieliec savu spēlētāja pozīcijas maiņas kodu
  // piemēram: player.position.x += STEP;
  // vai arī iedod callback no parent komponenta
  console.log('Moving:', direction);
}

// Komponents vienai virziena pogai ar ilgspiediena atbalstu
function MoveButton({ direction, onMove, children }) {
  const intervalRef = useRef(null);

  function handlePressIn() {
    onMove(direction); // uzreiz pirmais solis
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
      <Text style={styles.buttonText}>{children || direction}</Text>
    </TouchableOpacity>
  );
}

export default function Controls({ onMove }) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <MoveButton direction="up" onMove={onMove}>↑</MoveButton>
      </View>
      <View style={styles.row}>
        <MoveButton direction="left" onMove={onMove}>←</MoveButton>
        <View style={{ width: 32 }} />
        <MoveButton direction="right" onMove={onMove}>→</MoveButton>
      </View>
      <View style={styles.row}>
        <MoveButton direction="down" onMove={onMove}>↓</MoveButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', margin: 16 },
  row: { flexDirection: 'row', marginVertical: 2 },
  button: {
    backgroundColor: '#ddd',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  buttonText: { fontSize: 32, fontWeight: 'bold' },
});
