"use client";
import { Button } from "@/components/ui/button";
import { useUserContext } from "@/context/CreateContext";
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";

const Page = () => {
  const { TokenContract, TokenFaucetContract } = useUserContext();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error" | "";
  }>({
    text: "",
    type: "",
  });
  const [faucetBalance, setFaucetBalance] = useState<string>("");

  const mintToFaucet = async () => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      console.log("Minting to faucet...");
      if (!TokenContract) {
        throw new Error("Token contract not loaded");
      }

      if (!TokenFaucetContract) {
        throw new Error("Token Faucet contract not loaded");
      }

      const faucetAddress = TokenFaucetContract.target;
      if (!faucetAddress) {
        throw new Error("Faucet address is invalid");
      }

      console.log("Faucet address:", faucetAddress);

      const amount = ethers.parseEther("1000");
      const tx = await TokenContract.mint(faucetAddress, amount);

      setMessage({
        text: "Transaction submitted. Waiting for confirmation...",
        type: "success",
      });

      await tx.wait();
      setMessage({
        text: "Minted 1000 tokens to faucet successfully!",
        type: "success",
      });
      console.log("Minted to faucet successfully");
    } catch (error) {
      console.error("Error minting to faucet:", error);
      setMessage({
        text: `Error: ${
          error instanceof Error ? error.message : "Unknown error occurred"
        }`,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchFaucetBalance = async () => {
      if (!TokenFaucetContract || !TokenContract) return;

      try {
        const faucetAddress = TokenFaucetContract.target;
        const balance = await TokenContract.balanceOf(faucetAddress);
        setFaucetBalance(ethers.formatEther(balance));
      } catch (error) {
        console.error("Error fetching faucet balance:", error);
      }
    };

    fetchFaucetBalance();
  }, [TokenFaucetContract, TokenContract]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="mb-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">Faucet Balance</h2>
        <p className="text-2xl font-bold">
          {faucetBalance ? `${faucetBalance} TTK` : "Loading..."}
        </p>
      </div>
      <div className="flex flex-col gap-4">
        <Button
          onClick={mintToFaucet}
          disabled={isLoading}
          className="max-w-xs"
        >
          {isLoading ? "Processing..." : "MINT 1000 Tokens to Faucet"}
        </Button>

        {message.text && (
          <div
            className={`p-3 rounded ${
              message.type === "success"
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;
