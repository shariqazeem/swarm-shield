"use client";

import { BrowserSDK, AddressType } from "@phantom/browser-sdk";

let sdkInstance: BrowserSDK | null = null;

export function getPhantomSDK(): BrowserSDK {
  if (!sdkInstance) {
    sdkInstance = new BrowserSDK({
      providers: ["injected", "phantom"],
      addressTypes: [AddressType.solana],
      appId: "d267f2e6-b4ad-4d97-9201-338afd4bd38d",
      authOptions: {
        authUrl: "https://connect.phantom.app/login",
        redirectUrl: typeof window !== "undefined" ? window.location.origin : "https://frontend-five-phi-72.vercel.app",
      },
    });
  }
  return sdkInstance;
}
