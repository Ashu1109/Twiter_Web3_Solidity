# TwitterToken - Decentralized Twitter Clone

A blockchain-based Twitter clone built with Solidity smart contracts and Next.js frontend. This project demonstrates a decentralized social media platform where users can post tweets, like content, and earn tokens.

## Technologies Used

### Backend (Smart Contracts)
- **Solidity**: Programming language for Ethereum smart contracts
- **Hardhat**: Ethereum development environment
- **OpenZeppelin**: Library for secure smart contract development
- **Ethers.js**: JavaScript library to interact with Ethereum blockchain

### Smart Contracts
1. **TwitterToken.sol**: An ERC20 token used as the platform's currency
2. **TwitterAccount.sol**: Manages user profiles, tweets, and interactions
3. **TokenFaucet.sol**: Allows new users to claim initial tokens

### Frontend
- **Next.js 14**: React framework with server-side rendering
- **TypeScript**: For type safety and better developer experience
- **shadcn/ui**: Component library for the user interface
- **Context API**: For global state management
- **Web3 Integration**: To connect with Ethereum wallets and interact with smart contracts

## Features

- **User Registration**: Create accounts with username and bio
- **Token Economy**:
  - Spend 10 tokens to post a tweet
  - Spend 1 token to like someone's tweet
  - Claim 100 free tokens from the faucet (one-time)
- **Social Interactions**:
  - Post tweets
  - Like tweets (cannot like your own tweets)
  - Delete your own tweets
  - View all tweets or filtered by user
- **Wallet Integration**: Connect with Metamask or other Ethereum wallets

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Metamask or other Ethereum wallet browser extension

### Local Development

1. Clone the repository:
```bash
git clone <repository-url>
cd TwitterToken
```

2. Install dependencies and start the frontend:
```bash
cd frontend
npm install
npm run dev
```

3. Open your browser and go to `http://localhost:3000`

### Smart Contract Development

1. Install hardhat dependencies:
```bash
npm install
```

2. Start a local blockchain node:
```bash
npx hardhat node
```

3. Deploy the contracts to the local network:
```bash
npx hardhat ignition deploy ./ignition/modules/TwitterAccount.js --network localhost
```

## Contract Addresses (Local Network)

TwitterToken#TwitterToken - 0x5FbDB2315678afecb367f032d93F642f64180aa3
TokenFaucet#TokenFaucet - 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
TwitterAccount#TwitterAccount - 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0

## Project Structure

```plaintext
TwitterToken/
├── contracts/               # Solidity smart contracts
│   ├── TokenFaucet.sol      
│   ├── TwitterAccount.sol  
│   └── TwitterToken.sol    
├── frontend/               # Next.js frontend application
│   ├── app/                # Next.js pages and routes
│   ├── components/         # React components
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions
│   └── abis/               # Smart contract ABIs for frontend
├── ignition/               # Hardhat Ignition deployment modules
├── test/                   # Smart contract tests
└── hardhat.config.js       # Hardhat configuration
```

## How It Works

1. Users connect their Ethereum wallet to the application
2. New users can claim 100 tokens from the TokenFaucet contract
3. Users can register a profile with a username and bio
4. Creating a tweet costs 10 tokens, which are transferred to the contract
5. Liking another user's tweet costs 1 token
6. Users can view all tweets or filter by specific users
7. Tweet authors can delete their own tweets if needed

## License

This project is licensed under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
