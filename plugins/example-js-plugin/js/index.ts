import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { DeviceEventEmitter, Linking } from "react-native";

// Keycodes sent by Shokz multi-function hardware buttons
const SHOKZ_KEYCODES = [
  79,  // KEYCODE_HEADSETHOOK
  85,  // KEYCODE_MEDIA_PLAY_PAUSE
  126, // KEYCODE_MEDIA_PLAY
  127  // KEYCODE_MEDIA_PAUSE
];

// Find Discord internal media and voice modules
const MediaEngineActions = findByProps("toggleSelfMute");
const MediaEngineStore = findByProps("isSelfMute");

let keyListener: any = null;
let linkListener: any = null;

function toggleDiscordMute() {
  if (MediaEngineActions?.toggleSelfMute) {
    MediaEngineActions.toggleSelfMute();
    
    // Optional toast alert to confirm mute state on-screen
    const isMuted = MediaEngineStore?.isSelfMute?.() ?? false;
    showToast(isMuted ? "Shokz: Microphone Muted" : "Shokz: Microphone Unmuted");
  } else {
    showToast("Shokz Bridge Error: Voice module not found!");
  }
}

export default {
  onLoad: () => {
    // 1. Listen for hardware key presses directly inside Discord
    keyListener = DeviceEventEmitter.addListener(
      "onKeyDown",
      (event: { keyCode: number }) => {
        if (SHOKZ_KEYCODES.includes(event.keyCode)) {
          toggleDiscordMute();
        }
      }
    );

    // 2. Listen for Deep Link triggers (e.g., discord://shokz_toggle_mute)
    const handleUrl = (event: { url: string }) => {
      if (event.url.includes("shokz_toggle_mute")) {
        toggleDiscordMute();
      }
    };

    linkListener = Linking.addEventListener("url", handleUrl);
    
    showToast("Shokz Mute Bridge Loaded");
  },

  onUnload: () => {
    if (keyListener) keyListener.remove();
    if (linkListener) {
      if (typeof linkListener.remove === "function") {
        linkListener.remove();
      } else {
        Linking.removeEventListener("url", linkListener);
      }
    }
    showToast("Shokz Mute Bridge Unloaded");
  }
};