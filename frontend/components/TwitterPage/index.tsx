"use client";
import React, { useState, useEffect } from "react";
import { useUserContext } from "@/context/CreateContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ethers } from "ethers";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AllTweets from "./AllTweets";

const TwitterPage = () => {
  const [tweetContent, setTweetContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const {
    TwitterContract,
    walletAddress,
    balance,
    TokenContract,
    UpdateBalance,
  } = useUserContext();
  const [isApproved, setIsApproved] = useState(false);
  const TWEET_COST = ethers.parseEther("10"); // 10 tokens
  const [refetchTweets, setRefetchTweets] = useState(false);

  // Check if approval is needed
  useEffect(() => {
    const checkApproval = async () => {
      if (TokenContract && TwitterContract && walletAddress) {
        try {
          const allowance = await TokenContract.allowance(
            walletAddress,
            TwitterContract.target
          );
          setIsApproved(allowance >= TWEET_COST);
        } catch (error) {
          console.error("Error checking allowance:", error);
        }
      }
    };

    checkApproval();
  }, [TokenContract, TwitterContract, walletAddress, TWEET_COST]); // New function to handle token approval separately
  const approveTokenSpending = async () => {
    if (!TokenContract || !TwitterContract || !walletAddress) {
      alert("Please connect your wallet first");
      return;
    }

    try {
      setIsApproving(true);
      console.log("Approving token transfer...");
      // Can approve a larger amount to avoid needing approval for every tweet
      const largerAmount = ethers.parseEther("100"); // Approve 100 tokens at once
      const approveTx = await TokenContract.approve(
        TwitterContract.target,
        largerAmount
      );
      await approveTx.wait();
      setIsApproved(true);
      // Refresh balance after approval (in case there were any fees)
      if (UpdateBalance) {
        await UpdateBalance();
      }
      console.log("Token transfer approved");
    } catch (error: unknown) {
      console.error("Error approving tokens:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to approve tokens: ${errorMessage}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tweetContent.trim()) {
      alert("Tweet content cannot be empty");
      return;
    }

    if (!TwitterContract || !walletAddress || !TokenContract) {
      alert("Please connect your wallet first");
      return;
    }

    if (!isApproved) {
      alert("Please approve token spending before tweeting");
      return;
    }

    try {
      setIsSubmitting(true);

      // Create the tweet
      const tx = await TwitterContract.createTweet(tweetContent);
      await tx.wait();

      // Update the balance after the tweet is successful
      if (UpdateBalance) {
        await UpdateBalance();
      }

      setTweetContent("");
      setRefetchTweets((prev) => !prev);
      alert("Tweet created successfully!");
    } catch (error: unknown) {
      console.error("Error creating tweet:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      alert(`Failed to create tweet: ${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col items-center justify-start  p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Create a Tweet</CardTitle>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Textarea
                    placeholder="What's happening?"
                    value={tweetContent}
                    onChange={(e) => setTweetContent(e.target.value)}
                    rows={4}
                    className="resize-none"
                    maxLength={280}
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{tweetContent.length} / 280</span>
                    <span className="flex items-center">
                      Available tokens:{" "}
                      <span className="font-semibold ml-1 transition-all duration-300">
                        {balance || "0"}
                      </span>
                    </span>
                  </div>
                  {!isApproved && walletAddress && TokenContract && (
                    <div className="flex items-center justify-between mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="text-sm text-amber-500">
                        Token approval needed before tweeting
                      </div>
                      <Button
                        type="button"
                        onClick={approveTokenSpending}
                        disabled={
                          isApproving || !TokenContract || !walletAddress
                        }
                        variant="outline"
                        size="sm"
                        className="bg-amber-100 hover:bg-amber-200 border-amber-300"
                      >
                        {isApproving ? "Approving..." : "Approve Tokens"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-gray-500">
                Cost: 10 Twitter tokens
              </div>
              <Button
                type="submit"
                disabled={
                  !tweetContent.trim() ||
                  !TwitterContract ||
                  !walletAddress ||
                  !isApproved ||
                  isSubmitting
                }
                variant="default"
                className="w-32 disabled:opacity-50 disabled:cursor-not-allowed m-2"
              >
                {isSubmitting ? "Creating Tweet..." : "Tweet"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
      <AllTweets refetchTweets={refetchTweets} />
    </>
  );
};

export default TwitterPage;
