"use client";
import { useUserContext } from "@/context/CreateContext";
import React from "react";

// Define the Tweet interface
interface Tweet {
  id: number;
  author: string;
  content: string;
  timestamp: number;
  likeCount: bigint;
}

const AllTweets = ({ refetchTweets }: { refetchTweets: boolean }) => {
  const { TwitterContract, walletAddress } = useUserContext();
  const [allTweets, setAllTweets] = React.useState<Tweet[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [likingTweet, setLikingTweet] = React.useState<number | null>(null);

  React.useEffect(() => {
    // Reset error state when dependencies change
    setError(null);

    const fetchTweets = async () => {
      // If contract or wallet isn't loaded yet, just wait - don't show error
      if (!TwitterContract || !walletAddress) {
        return;
      }

      setLoading(true);
      try {
        const tweets = await TwitterContract.getAllTweets();
        console.log("Fetched tweets:", tweets);
        setAllTweets(tweets);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching tweets:", error);
        setError(
          "Failed to load tweets. Please check your connection and try again."
        );
        setLoading(false);
      }
    };

    fetchTweets();
  }, [TwitterContract, walletAddress, refetchTweets]);

  // Add state for user's token balance
  const [userBalance, setUserBalance] = React.useState<number>(0);
  const LIKE_COST = 1; // 1 token to like (matching contract's LIKE_COST)

  // Fetch user's token balance
  React.useEffect(() => {
    const fetchBalance = async () => {
      if (!TwitterContract || !walletAddress) return;

      try {
        const balance = await TwitterContract.balanceOf(walletAddress);
        // Convert from wei (10^18) to tokens
        setUserBalance(Number(balance) / 10 ** 18);
      } catch (err) {
        console.error("Error fetching token balance:", err);
      }
    };

    fetchBalance();
  }, [TwitterContract, walletAddress]);

  const handleLike = async (tweetId: number) => {
    if (!TwitterContract || !walletAddress) {
      setError("Please connect your wallet to like tweets.");
      return;
    }

    try {
      // Clear any previous errors
      setError(null);

      // Check if the user has enough tokens to like the tweet
      if (userBalance < LIKE_COST) {
        setError("You don't have enough tokens to like this tweet.");
        return;
      }

      setLikingTweet(tweetId);
      const tx = await TwitterContract.likeTweet(tweetId);
      await tx.wait();

      // Update the tweet in the UI
      setAllTweets((prevTweets) =>
        prevTweets.map((tweet) =>
          tweet.id === tweetId
            ? { ...tweet, likeCount: tweet.likeCount + BigInt(1) }
            : tweet
        )
      );

      // Update user's balance after successful like
      const newBalance = await TwitterContract.balanceOf(walletAddress);
      setUserBalance(Number(newBalance) / 10 ** 18);

      setLikingTweet(null);
    } catch (error: unknown) {
      console.error("Error liking tweet:", error);
      let errorMessage = "Failed to like tweet.";
      // Provide more helpful error messages
      const errorObj = error as { reason?: string };
      if (errorObj.reason?.includes("Cannot like your own tweet")) {
        errorMessage = "You cannot like your own tweet.";
      } else if (errorObj.reason?.includes("Insufficient Twitter tokens")) {
        errorMessage =
          "You don't have enough Twitter tokens to like this tweet.";
      }

      setError(errorMessage);
      setLikingTweet(null);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto bg-gray-50 rounded-lg shadow-md border border-gray-200 mt-8 mb-8 md:mt-12 md:mb-12 lg:mt-16 lg:mb-16 xl:mt-20 xl:mb-20 2xl:mt-24 2xl:mb-24">
      <h2 className="text-2xl font-bold mb-6">All Tweets</h2>

      {/* Show loading state */}
      {loading && (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading tweets...</span>
        </div>
      )}

      {/* Show error message if any */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Show message if no contract or wallet is available */}
      {!TwitterContract || !walletAddress ? (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>
            Connecting to wallet and loading contract... Please make sure
            MetaMask is installed and connected.
          </p>
        </div>
      ) : null}

      {/* Show message if no tweets */}
      {!loading &&
        !error &&
        TwitterContract &&
        walletAddress &&
        allTweets.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            <p>No tweets found.</p>
          </div>
        )}

      <div className="space-y-4">
        {[...allTweets].reverse().map((tweet, index) => (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {tweet.author ? tweet.author.slice(0, 2) : "A"}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-medium text-gray-900">
                    {tweet.author
                      ? `${tweet.author.slice(0, 6)}...${tweet.author.slice(
                          -4
                        )}`
                      : "Anonymous"}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {tweet.timestamp
                      ? new Date(
                          Number(tweet.timestamp) * 1000
                        ).toLocaleDateString()
                      : "Unknown date"}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed">{tweet.content}</p>
                <div className="flex items-center space-x-2 mt-4">
                  <button
                    onClick={() => handleLike(tweet.id)}
                    disabled={
                      likingTweet === tweet.id ||
                      tweet.author === walletAddress ||
                      userBalance < LIKE_COST
                    }
                    className={`flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      tweet.author === walletAddress
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : userBalance < LIKE_COST
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : tweet.likeCount > BigInt(0)
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-gray-50 hover:bg-red-50 hover:text-red-600"
                    }`}
                    title={
                      tweet.author === walletAddress
                        ? "You cannot like your own tweet"
                        : userBalance < LIKE_COST
                        ? `You need ${LIKE_COST} token to like (you have ${userBalance.toFixed(
                            2
                          )})`
                        : "Like this tweet"
                    }
                  >
                    {likingTweet === tweet.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500 mr-2"></div>
                        <span>Liking...</span>
                      </>
                    ) : (
                      <>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill={tweet.likeCount > BigInt(0) ? "currentColor" : "none"}
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                        <span>
                          {String(tweet.likeCount) || "0"}{" "}
                          {tweet.likeCount === BigInt(1) ? "Like" : "Likes"}
                        </span>
                      </>
                    )}
                  </button>
                  {tweet.author === walletAddress && (
                    <span className="text-xs text-gray-500">
                      You cannot like your own tweet
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllTweets;
