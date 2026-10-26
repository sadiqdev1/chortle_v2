import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const storage = {
  // 🔐 Sensitive
  async getToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },

  async setToken(token) {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  },

  async removeToken() {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  },

  // 👤 Non-secret user data
  async getUser() {
    const user = await AsyncStorage.getItem(USER_KEY);

    if (!user) return null;

    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  },

  async setUser(user) {
    return AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  async removeUser() {
    return AsyncStorage.removeItem(USER_KEY);
  },

  async clearAuth() {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      AsyncStorage.removeItem(USER_KEY),
    ]);
  },
};