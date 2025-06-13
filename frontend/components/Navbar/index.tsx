"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/CreateContext";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<string[]>;
  on: (event: string, callback: (accounts: string[]) => void) => void;
  removeListener: (
    event: string,
    callback: (accounts: string[]) => void
  ) => void;
}

interface Web3Window extends Window {
  ethereum?: EthereumProvider;
}

declare const window: Web3Window;

const Navbar = () => {
  const { walletAddress, setWalletAddress, isOwner } = useUserContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [hasRequestedConnection, setHasRequestedConnection] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  }, [setWalletAddress]);
  useEffect(() => {
    // Check if MetaMask is installed
    setIsMetaMaskInstalled(typeof window !== "undefined" && !!window.ethereum);

    // Check if already connected (only if not already connected)
    if (window.ethereum && !walletAddress) {
      checkConnection();
    }
  }, [checkConnection, walletAddress]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError(
        "MetaMask is not installed. Please install MetaMask to continue."
      );
      return;
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting || hasRequestedConnection) {
      return;
    }

    setIsConnecting(true);
    setHasRequestedConnection(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);

        // Listen for account changes
        window.ethereum.on("accountsChanged", (accounts: string[]) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          } else {
            setWalletAddress(null);
          }
        });

        // Listen for chain changes
        window.ethereum.on("chainChanged", () => {
          window.location.reload();
        });
      }
    } catch (error: unknown) {
      console.error("Error connecting wallet:", error);

      // Handle specific MetaMask errors
      if (error && typeof error === "object" && "code" in error) {
        const metamaskError = error as { code: number; message: string };
        if (metamaskError.code === -32002) {
          setError(
            "Connection request already pending. Please check MetaMask and try again."
          );
        } else if (metamaskError.code === 4001) {
          setError(
            "Connection rejected. Please approve the connection in MetaMask."
          );
        } else {
          setError(metamaskError.message || "Failed to connect wallet");
        }
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to connect wallet";
        setError(errorMessage);
      }
    } finally {
      setIsConnecting(false);
      // Reset the request flag after a short delay to allow for retry
      setTimeout(() => {
        setHasRequestedConnection(false);
      }, 2000);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-foreground">TwitterToken</h1>
          </div>

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {!isMetaMaskInstalled ? (
              <Button
                onClick={() =>
                  window.open("https://metamask.io/download/", "_blank")
                }
                variant="outline"
                className="flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Install MetaMask</span>
              </Button>
            ) : walletAddress ? (
              <div className="flex items-center space-x-2">
                {isOwner && (
                  <span className="text-xs space-x-1 text-green-500 font-semibold">
                    Owner
                  </span>
                )}
                <div className="flex items-center space-x-2 px-3 py-2 bg-secondary rounded-md">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">
                    {formatAddress(walletAddress)}
                  </span>
                </div>
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <Link href={"/admin"}>
                      <span>Admin Panel</span>
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={connectWallet}
                disabled={isConnecting || hasRequestedConnection}
                className="flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>
                  {isConnecting
                    ? "Connecting..."
                    : hasRequestedConnection
                    ? "Check MetaMask..."
                    : "Connect Wallet"}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setError(null);
                    setHasRequestedConnection(false);
                  }}
                  className="ml-2 h-auto p-1 text-xs"
                >
                  Clear
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
