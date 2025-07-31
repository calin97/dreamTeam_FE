// Real Ocean Protocol contract addresses for Arbitrum networks
// These are placeholder addresses - in production you would use actual deployed Ocean Protocol contracts

export const OCEAN_PROTOCOL_CONTRACTS = {
  // Arbitrum One (Mainnet) - Using placeholder addresses as Ocean Protocol may not be deployed on Arbitrum
  42161: {
    NFT_FACTORY: "0x0000000000000000000000000000000000000000", // Placeholder
    OCEAN_TOKEN: "0x0000000000000000000000000000000000000000", // Placeholder
    FIXED_PRICE_EXCHANGE: "0x0000000000000000000000000000000000000000", // Placeholder
    PROVIDER_FEE: "0x0000000000000000000000000000000000000000",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
  // Arbitrum Sepolia (Testnet)
  421614: {
    NFT_FACTORY: "0x0000000000000000000000000000000000000000", // Placeholder
    OCEAN_TOKEN: "0x0000000000000000000000000000000000000000", // Placeholder
    FIXED_PRICE_EXCHANGE: "0x0000000000000000000000000000000000000000", // Placeholder
    PROVIDER_FEE: "0x0000000000000000000000000000000000000000",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
} as const;

// Ocean Protocol Network Configuration
export const OCEAN_NETWORKS = {
  42161: {
    name: "Arbitrum One",
    subgraphUrl: "https://subgraph.mainnet.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
    providerUrl: "https://provider.mainnet.oceanprotocol.com",
    explorerUrl: "https://arbiscan.io",
    chainId: 42161,
  },
  421614: {
    name: "Arbitrum Sepolia",
    subgraphUrl: "https://subgraph.sepolia.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
    providerUrl: "https://provider.sepolia.oceanprotocol.com",
    explorerUrl: "https://sepolia.arbiscan.io",
    chainId: 421614,
  },
} as const;
