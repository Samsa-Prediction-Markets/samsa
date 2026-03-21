import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_PREFIX = 'samsa_';

export const Storage = {
  async save(key, value) {
    try {
      await AsyncStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  async load(key, defaultValue = null) {
    try {
      const item = await AsyncStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      console.error('Storage load error:', e);
      return defaultValue;
    }
  },

  async remove(key) {
    try {
      await AsyncStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
      console.error('Storage remove error:', e);
    }
  },

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const samsaKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));
      await AsyncStorage.multiRemove(samsaKeys);
    } catch (e) {
      console.error('Storage clear error:', e);
    }
  },
};

export default Storage;
