"use client";

import {
  createContext,
  FC,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PublicKey, Transaction, VersionedTransaction } from "@solana/web3.js";

interface PhantomWalletContextState {
  connected: boolean;
  publicKey: PublicKey | null;
  connecting: boolean;
  phantomReady: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (<T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>) | undefined;
  signAllTransactions: (<T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>) | undefined;
}

const PhantomWalletContext = createContext<PhantomWalletContextState>({
  connected: false,
  publicKey: null,
  connecting: false,
  phantomReady: false,
  connect: async () => {},
  disconnect: async () => {},
  signTransaction: undefined,
  signAllTransactions: undefined,
});

export const useWallet = () => useContext(PhantomWalletContext);

interface Props {
  children: ReactNode;
}

function getProvider(): any | null {
  if (typeof window === "undefined") return null;
  // Check for Phantom
  if ((window as any).phantom?.solana?.isPhantom) {
    return (window as any).phantom.solana;
  }
  // Check for Solflare or other wallets that inject into window.solana
  if ((window as any).solana?.isPhantom) {
    return (window as any).solana;
  }
  return null;
}

export const PhantomWalletProvider: FC<Props> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [phantomReady, setPhantomReady] = useState(false);
  const providerRef = useRef<any>(null);

  // Wait for Phantom extension to be available
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 20; // Try for 2 seconds (20 * 100ms)

    const checkProvider = () => {
      const provider = getProvider();
      if (provider) {
        console.log("Phantom provider found!");
        providerRef.current = provider;
        setPhantomReady(true);

        // Check if already connected
        if (provider.isConnected && provider.publicKey) {
          setPublicKey(new PublicKey(provider.publicKey.toString()));
          setConnected(true);
        }

        // Set up event listeners
        provider.on("connect", (pk: any) => {
          console.log("Phantom connected event:", pk.toString());
          setPublicKey(new PublicKey(pk.toString()));
          setConnected(true);
          setConnecting(false);
        });

        provider.on("disconnect", () => {
          console.log("Phantom disconnected");
          setPublicKey(null);
          setConnected(false);
        });

        provider.on("accountChanged", (pk: any) => {
          if (pk) {
            setPublicKey(new PublicKey(pk.toString()));
          } else {
            setPublicKey(null);
            setConnected(false);
          }
        });

        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(checkProvider, 100);
      } else {
        console.log("Phantom not detected after 2s, trying SDK fallback");
        // Try Phantom Browser SDK as fallback
        initSDKFallback();
      }
    };

    const initSDKFallback = async () => {
      try {
        const { BrowserSDK, AddressType } = await import("@phantom/browser-sdk");
        const sdk = new BrowserSDK({
          providers: ["injected", "phantom"],
          addressTypes: [AddressType.solana],
          appId: "d267f2e6-b4ad-4d97-9201-338afd4bd38d",
          authOptions: {
            authUrl: "https://connect.phantom.app/login",
            redirectUrl: window.location.origin,
          },
        });
        providerRef.current = sdk;
        setPhantomReady(true);
        console.log("Phantom Browser SDK initialized as fallback");
      } catch (e) {
        console.error("Failed to init Phantom SDK fallback:", e);
        setPhantomReady(true); // Still mark ready so button shows "Get Phantom"
      }
    };

    checkProvider();
  }, []);

  const connect = useCallback(async () => {
    const provider = providerRef.current;

    if (!provider) {
      // No provider available - open Phantom download page
      window.open("https://phantom.app/", "_blank");
      return;
    }

    setConnecting(true);

    try {
      // Check if this is a BrowserSDK instance (has 'connect' with provider option)
      if (provider.constructor?.name === "BrowserSDK" || provider.getAddresses) {
        // Using Browser SDK
        try {
          await provider.connect({ provider: "injected" });
        } catch {
          await provider.connect({ provider: "phantom" });
        }
        const addresses = provider.getAddresses();
        const solAddress = addresses.find((a: any) => a.type === "solana");
        if (solAddress) {
          setPublicKey(new PublicKey(solAddress.address));
          setConnected(true);
        }
      } else {
        // Using direct window.phantom.solana provider
        const resp = await provider.connect();
        setPublicKey(new PublicKey(resp.publicKey.toString()));
        setConnected(true);
      }
    } catch (err: any) {
      console.error("Connect error:", err?.message || err);
      if (err?.code === 4001) {
        // User rejected - do nothing
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    const provider = providerRef.current;
    if (provider) {
      try {
        await provider.disconnect();
      } catch (err) {
        console.error("Disconnect error:", err);
      }
    }
    setPublicKey(null);
    setConnected(false);
  }, []);

  const signTransaction = useCallback(
    async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
      const provider = providerRef.current;
      if (!provider) throw new Error("Wallet not connected");

      if (provider.solana?.signTransaction) {
        // Browser SDK
        return provider.solana.signTransaction(tx) as Promise<T>;
      }
      // Direct provider
      return provider.signTransaction(tx);
    },
    []
  );

  const signAllTransactions = useCallback(
    async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
      const provider = providerRef.current;
      if (!provider) throw new Error("Wallet not connected");

      if (provider.solana?.signAllTransactions) {
        // Browser SDK
        return provider.solana.signAllTransactions(txs) as Promise<T[]>;
      }
      // Direct provider
      return provider.signAllTransactions(txs);
    },
    []
  );

  return (
    <PhantomWalletContext.Provider
      value={{
        connected,
        publicKey,
        connecting,
        phantomReady,
        connect,
        disconnect,
        signTransaction: connected ? signTransaction : undefined,
        signAllTransactions: connected ? signAllTransactions : undefined,
      }}
    >
      {children}
    </PhantomWalletContext.Provider>
  );
};
