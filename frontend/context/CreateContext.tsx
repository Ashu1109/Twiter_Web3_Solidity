"use client";
import { loadBlockchainData } from "@/hooks/useLoadContract";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { ethers } from "ethers";

const Context = createContext<{
  isOwner: boolean;
  UpdateBalance: () => Promise<void>;
  balance: string | null;
  user: [string, string, string, string[]] | undefined;
  setUser: React.Dispatch<
    React.SetStateAction<[string, string, string, string[]] | undefined>
  >;
  walletAddress: string | null;
  setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  TwitterContract: ethers.Contract | null;
  TokenContract: ethers.Contract | null;
  TokenFaucetContract: ethers.Contract | null;
}>(
  {} as {
    isOwner: boolean;
    UpdateBalance: () => Promise<void>;
    balance: string | null;
    user: [string, string, string, string[]] | undefined;
    setUser: React.Dispatch<
      React.SetStateAction<[string, string, string, string[]] | undefined>
    >;
    walletAddress: string | null;
    setWalletAddress: React.Dispatch<React.SetStateAction<string | null>>;
    provider: ethers.BrowserProvider | null;
    signer: ethers.JsonRpcSigner | null;
    TwitterContract: ethers.Contract | null;
    TokenContract: ethers.Contract | null;
    TokenFaucetContract: ethers.Contract | null;
  }
);

const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [TwitterContract, setTwitterContract] =
    useState<ethers.Contract | null>(null);
  const [TokenContract, setTokenContract] = useState<ethers.Contract | null>(
    null
  );
  const [TokenFaucetContract, setTokenFaucetContract] =
    useState<ethers.Contract | null>(null);
  const [user, setUser] = useState<[string, string, string, string[]]>();
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);

  const UpdateBalance = useCallback(async () => {
    // Only attempt to get balance if both TwitterContract and walletAddress are set
    if (TwitterContract && walletAddress) {
      try {
        const balance = await TwitterContract.balanceOf(walletAddress);
        setBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(null);
      }
    } else {
      // During initial loading, these values might not be set yet, so we don't need an error
      setBalance(null);
    }
  }, [TwitterContract, walletAddress]);
  useEffect(() => {
    UpdateBalance();
  }, [TwitterContract, walletAddress, UpdateBalance]);

  const loadData = async () => {
    console.log("Loading blockchain data...");
    const {
      provider,
      signer,
      TwitterContract,
      TokenContract,
      TokenFaucetContract,
      walletAddress,
      user,
      isOwner,
    } = await loadBlockchainData();
    console.log("Provider:", provider);
    console.log("Signer:", signer);
    console.log("TwitterContract:", TwitterContract);
    console.log("TokenContract:", TokenContract);
    console.log("TokenFaucetContract:", TokenFaucetContract);
    console.log("Wallet Address:", walletAddress);
    console.log("User:", user);
    console.log("Is Owner:", isOwner);
    setProvider(provider);
    setSigner(signer);
    setTwitterContract(TwitterContract);
    setTokenContract(TokenContract);
    setTokenFaucetContract(TokenFaucetContract);
    setWalletAddress(walletAddress);
    setUser(user);
    setIsOwner(isOwner);
  };
  useEffect(() => {
    loadData();
  }, []);

  return (
    <Context.Provider
      value={{
        isOwner,
        UpdateBalance,
        balance,
        user,
        setUser,
        walletAddress,
        setWalletAddress,
        provider,
        signer,
        TwitterContract,
        TokenContract,
        TokenFaucetContract,
      }}
    >
      {children}
    </Context.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
};

export default UserProvider;
