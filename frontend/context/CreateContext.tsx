"use client";
import { loadBlockchainData } from "@/hooks/useLoadContract";
import { createContext, useContext, useEffect, useState } from "react";
import { ethers } from "ethers";

const Context = createContext<{
  isOwner: boolean;
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

  const loadData = async () => {
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
