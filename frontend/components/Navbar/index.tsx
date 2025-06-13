"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/CreateContext";
import { Wallet, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Sepolia network parameters
const SEPOLIA_CHAIN_ID = "0xaa36a7"; // 11155111 in hex
const SEPOLIA_NETWORK_PARAMS = {
  chainId: SEPOLIA_CHAIN_ID,
  chainName: "Sepolia",
  nativeCurrency: {
    name: "Sepolia ETH",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["https://sepolia.infura.io/v3/ac9a163f8c744586a666d4a8da45e5b7"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  isMetaMask?: boolean;
  selectedAddress?: string;
  chainId?: string;
  on?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (
    event: string,
    callback: (...args: unknown[]) => void
  ) => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

const Navbar = () => {
  const {
    walletAddress,
    setWalletAddress,
    isOwner,
    TwitterContract,
    balance,
    UpdateBalance,
  } = useUserContext();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [hasRequestedConnection, setHasRequestedConnection] = useState(false);
  const pathname = usePathname();
  const { user, TokenFaucetContract } = useUserContext();
  const [hasClaimed, setHasClaimed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = useCallback(async () => {
    try {
      if (!window.ethereum) return;

      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });

      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        setWalletAddress(accounts[0] as string);
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
  }, [checkConnection, walletAddress]); // Function to switch to Sepolia network
  const switchToSepolia = async () => {
    if (!window.ethereum) return false;

    try {
      // First try to switch to the network if it's already added
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      return true;
    } catch (switchError: unknown) {
      // Check if the error is an object with a code property
      if (
        switchError &&
        typeof switchError === "object" &&
        "code" in switchError
      ) {
        const error = switchError as { code: number };
        // If the error code is 4902, the network is not added yet
        if (error.code === 4902) {
          try {
            // Add the network
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [SEPOLIA_NETWORK_PARAMS],
            });
            return true;
          } catch (addError) {
            console.error("Error adding Sepolia network:", addError);
            setError(
              "Failed to add Sepolia network. Please add it manually in MetaMask."
            );
            return false;
          }
        }
      }
      console.error("Error switching to Sepolia:", switchError);
      setError(
        "Failed to switch to Sepolia network. Please try again or switch manually in MetaMask."
      );
      return false;
    }
  };

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
      // First check and switch to Sepolia network if needed
      const chainId = await window.ethereum.request({ method: "eth_chainId" });

      if (chainId !== SEPOLIA_CHAIN_ID) {
        const switched = await switchToSepolia();
        if (!switched) {
          setIsConnecting(false);
          setHasRequestedConnection(false);
          return;
        }
      }

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Type check the accounts response
      if (accounts && Array.isArray(accounts) && accounts.length > 0) {
        const account = accounts[0] as string;
        setWalletAddress(account);

        // Set up event listeners with proper type handling
        const handleAccountsChanged = (...args: unknown[]) => {
          const changedAccounts = args[0];
          if (
            changedAccounts &&
            Array.isArray(changedAccounts) &&
            changedAccounts.length > 0
          ) {
            setWalletAddress(changedAccounts[0] as string);
          } else {
            setWalletAddress(null);
          }
        };

        const handleChainChanged = (...args: unknown[]) => {
          const changedChainId = args[0];
          // If changed to a non-Sepolia network
          if (
            typeof changedChainId === "string" &&
            changedChainId !== SEPOLIA_CHAIN_ID
          ) {
            setError(
              "Please switch to the Sepolia network to use this application."
            );
          } else {
            setError(null);
          }
          // Still reload for state consistency
          window.location.reload();
        };

        // Check if ethereum is available before adding event listeners
        const ethereum = window.ethereum;
        if (ethereum && typeof ethereum.on === "function") {
          // Check if the on method exists and is a function
          ethereum.on("accountsChanged", handleAccountsChanged);
          ethereum.on("chainChanged", handleChainChanged);
        }
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

  const getHasClaimed = async () => {
    try {
      if (!TokenFaucetContract || !walletAddress || !TwitterContract) {
        console.log("TokenFaucetContract or walletAddress is not initialized");
        return;
      }
      if (!user || user[0] === "") {
        console.log("User is not registered. Please register first.");
        return;
      }
      console.log("Checking if user has claimed tokens...");
      const data = await TokenFaucetContract.hasClaimed(walletAddress);
      const balance = await TwitterContract.balanceOf(walletAddress);
      console.log("User has claimed tokens:", data);
      console.log("User balance:", balance.toString());
      UpdateBalance();
      setHasClaimed(data);
      if (data) {
        console.log("You have already claimed your tokens.");
      }
    } catch (error) {
      console.error("Error checking claim status:", error);
      console.log("You have not claimed your tokens yet.");
      return false;
    }
  };
  useEffect(() => {
    getHasClaimed();
  }, [walletAddress, TokenFaucetContract, user]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };
  const claimToken = async () => {
    try {
      setLoading(true);
      if (!TokenFaucetContract || !walletAddress || !TwitterContract) {
        console.log("TokenFaucetContract or walletAddress is not initialized");
        return;
      }
      if (!user || user[0] === "") {
        console.log("User is not registered. Please register first.");
        return;
      }
      console.log("Claiming tokens...");
      const tx = await TokenFaucetContract.claimTokens();
      await tx.wait();
      const balance = await TwitterContract.balanceOf(walletAddress);
      console.log(
        "Tokens claimed successfully. New balance:",
        balance.toString()
      );
      UpdateBalance();
      console.log("Tokens claimed successfully!");
      setHasClaimed(true);
    } catch (error) {
      console.error("Error claiming tokens:", error);
      if (error instanceof Error) {
        console.log("Error message:", error.message);
      }
    } finally {
      setLoading(false);
    }
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
                {pathname == "/home" && (
                  <Button
                    disabled={true}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <span>
                      Balance: {balance ? `${balance} TWT` : "Loading..."}
                    </span>
                  </Button>
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
                {pathname == "/home" && (
                  <Button
                    onClick={claimToken}
                    disabled={
                      hasClaimed || !TokenFaucetContract || !user || loading
                    }
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    {hasClaimed ? "Claimed" : "Claim"}
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
