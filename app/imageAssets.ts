import * as FileSystem from "expo-file-system";

// Definē attēlu nosaukumus un url
export const IMAGES = {
  player: "http://localhost:8000/player2.png",
  coin:   "http://localhost:8000/coin.png",
  // pievieno citus pēc vajadzības
};

// Funkcija, kas lejupielādē visus attēlus un atgriež { key: localUri }
export async function downloadAllImages() {
  const results = {};
  for (const [key, url] of Object.entries(IMAGES)) {
    const fileUri = FileSystem.cacheDirectory + url.split("/").pop();
    try {
      await FileSystem.downloadAsync(url, fileUri);
      results[key] = fileUri;
    } catch (e) {
      console.warn("Failed to download", key, url, e);
      results[key] = null;
    }
  }
  return results;
}
