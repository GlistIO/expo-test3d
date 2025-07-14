import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  PICKUP_COUNTS: 'game_pickup_counts',
  COLLECTED_PICKUPS: 'game_collected_pickups',
  CURRENT_SCENE: 'game_current_scene',
  PLAYER_POSITION: 'game_player_position',
};

export interface GameData {
  pickupCounts: Record<string, number>;
  collectedPickups: string[];
  currentScene: number;
  playerPosition: { x: number; y: number };
}

export async function saveGameData(data: GameData): Promise<void> {
  try {
    // Validate data before saving
    if (data.currentScene === undefined || data.currentScene === null) {
      throw new Error('currentScene cannot be undefined or null');
    }
    if (!data.pickupCounts) {
      throw new Error('pickupCounts cannot be undefined or null');
    }
    if (!data.playerPosition) {
      throw new Error('playerPosition cannot be undefined or null');
    }

    const promises = [
      AsyncStorage.setItem(STORAGE_KEYS.PICKUP_COUNTS, JSON.stringify(data.pickupCounts)),
      AsyncStorage.setItem(STORAGE_KEYS.COLLECTED_PICKUPS, JSON.stringify(data.collectedPickups || [])),
      AsyncStorage.setItem(STORAGE_KEYS.CURRENT_SCENE, JSON.stringify(data.currentScene)),
      AsyncStorage.setItem(STORAGE_KEYS.PLAYER_POSITION, JSON.stringify(data.playerPosition)),
    ];
    
    await Promise.all(promises);
    console.log('Game data saved successfully');
  } catch (error) {
    console.error('Failed to save game data:', error);
    throw error; // Re-throw to let caller handle it
  }
}

export async function loadGameData(): Promise<GameData | null> {
  try {
    const [pickupCounts, collectedPickups, currentScene, playerPosition] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.PICKUP_COUNTS),
      AsyncStorage.getItem(STORAGE_KEYS.COLLECTED_PICKUPS),
      AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SCENE),
      AsyncStorage.getItem(STORAGE_KEYS.PLAYER_POSITION),
    ]);

    if (!pickupCounts || !currentScene || !playerPosition) {
      return null; // No saved data found
    }

    return {
      pickupCounts: JSON.parse(pickupCounts),
      collectedPickups: collectedPickups ? JSON.parse(collectedPickups) : [],
      currentScene: JSON.parse(currentScene),
      playerPosition: JSON.parse(playerPosition),
    };
  } catch (error) {
    console.error('Failed to load game data:', error);
    return null;
  }
}

export async function clearGameData(): Promise<void> {
  try {
    const promises = Object.values(STORAGE_KEYS).map(key => AsyncStorage.removeItem(key));
    await Promise.all(promises);
    console.log('Game data cleared successfully');
  } catch (error) {
    console.error('Failed to clear game data:', error);
  }
}

export async function hasExistingSave(): Promise<boolean> {
  try {
    const currentScene = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_SCENE);
    return currentScene !== null;
  } catch (error) {
    console.error('Failed to check for existing save:', error);
    return false;
  }
}
