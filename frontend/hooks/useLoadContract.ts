import { ethers } from "ethers";
import TwitterAccountAbis from "@/abis/TwitterAccount.json";
import TokenAbis from "@/abis/TwitterToken.json";
import TokenFaucetAbis from "@/abis/TokenFaucet.json";
import DeployAddress from "@/abis/config.json";

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      isMetaMask?: boolean;
      selectedAddress?: string;
      chainId?: string;
      on?: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener?: (
        event: string,
        callback: (...args: unknown[]) => void
      ) => void;
    };
  }
}
export async function loadBlockchainData() {
  // Use MetaMask for our connection
  if (!window.ethereum) {
    throw new Error("MetaMask is not installed");
  }
  const provider = new ethers.BrowserProvider(window.ethereum);

  const signer = await provider.getSigner();
  const TwitterContract = new ethers.Contract(
    DeployAddress["TwitterAccount#TwitterAccount"],
    TwitterAccountAbis.abi,
    signer
  );
  const TokenContract = new ethers.Contract(
    DeployAddress["TwitterToken#TwitterToken"],
    TokenAbis.abi,
    signer
  );
  const TokenFaucetContract = new ethers.Contract(
    DeployAddress["TokenFaucet#TokenFaucet"],
    TokenFaucetAbis.abi,
    signer
  );

  // Get the user's address once to avoid multiple calls
  const address = await signer.getAddress();

  // Get the user info
  const user = await TwitterContract.getUserByAddress(address);

  // Get the contract owner address
  const ownerAddress = await TokenContract.owner();

  // Check if the current account is the owner
  const isOwner = ownerAddress.toLowerCase() === address.toLowerCase();

  console.log("Contract Owner:", ownerAddress);
  console.log("Current User:", address);
  console.log("Is Owner:", isOwner);

  return {
    isOwner,
    user,
    walletAddress: address,
    provider,
    signer,
    TwitterContract,
    TokenContract,
    TokenFaucetContract,
  };
}
