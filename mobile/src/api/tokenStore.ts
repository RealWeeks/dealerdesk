import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const key = "dealdesk.authToken";

function webStorage() {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export async function getStoredToken() {
  if (Platform.OS === "web") return webStorage()?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

export async function storeToken(token: string) {
  if (Platform.OS === "web") {
    webStorage()?.setItem(key, token);
    return;
  }
  await SecureStore.setItemAsync(key, token);
}

export async function clearStoredToken() {
  if (Platform.OS === "web") {
    webStorage()?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
