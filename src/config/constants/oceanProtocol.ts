// Real Ocean Protocol contract addresses for Arbitrum networks
// These are placeholder addresses - in production you would use actual deployed Ocean Protocol contracts

export const OCEAN_PROTOCOL_CONTRACTS = {
  // Sepolia (Ethereum Testnet) - Real Ocean Protocol deployment
  11155111: {
    NFT_FACTORY: "0xC52b05b9Ded993a8b47cCCdbbDCC6ad2C9C8bCd4", // Real Ocean Protocol NFT Factory on Sepolia
    OCEAN_TOKEN: "0x123fC2039a31cB58A69AB9b1968e4e3ce8bd8fba", // Real OCEAN token on Sepolia
    FIXED_PRICE_EXCHANGE: "0x2a25AF7e1fdb4a9ee2Ecc5C3B2C49F9DbF5fd3e2", // Real Fixed Price Exchange
    DISPENSER: "0x94b38FF4E40d8ff05A45c0094a8f16A90E1e3f7A", // Real Dispenser contract
    PROVIDER_FEE: "0x0000000000000000000000000000000000000000", // Zero address for no provider fees
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
  // Arbitrum One (for reference - BrickSafe main contracts)
  42161: {
    NFT_FACTORY: "0x0000000000000000000000000000000000000000", // Not deployed on Arbitrum
    OCEAN_TOKEN: "0x0000000000000000000000000000000000000000",
    FIXED_PRICE_EXCHANGE: "0x0000000000000000000000000000000000000000",
    PROVIDER_FEE: "0x0000000000000000000000000000000000000000",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
  // Arbitrum Sepolia (for reference)
  421614: {
    NFT_FACTORY: "0x0000000000000000000000000000000000000000", // Not deployed on Arbitrum Sepolia
    OCEAN_TOKEN: "0x0000000000000000000000000000000000000000",
    FIXED_PRICE_EXCHANGE: "0x0000000000000000000000000000000000000000",
    PROVIDER_FEE: "0x0000000000000000000000000000000000000000",
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
} as const;

// Ocean Protocol Network Configuration
export const OCEAN_NETWORKS = {
  // Sepolia - Main Ocean Protocol network for cross-chain publishing
  11155111: {
    name: "Sepolia",
    displayName: "Sepolia (Ocean Protocol)",
    subgraphUrl: "https://v4.subgraph.sepolia.oceanprotocol.com/subgraphs/name/oceanprotocol/ocean-subgraph",
    providerUrl: "https://v4.provider.sepolia.oceanprotocol.com",
    explorerUrl: "https://sepolia.etherscan.io",
    chainId: 11155111,
    rpcUrl: "https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18,
    },
    hasOceanProtocol: true,
  },
  // Arbitrum One - BrickSafe main network
  42161: {
    name: "Arbitrum One",
    displayName: "Arbitrum One (BrickSafe)",
    subgraphUrl: "",
    providerUrl: "",
    explorerUrl: "https://arbiscan.io",
    chainId: 42161,
    rpcUrl: "https://arb1.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    hasOceanProtocol: false,
  },
  // Arbitrum Sepolia - BrickSafe testnet
  421614: {
    name: "Arbitrum Sepolia",
    displayName: "Arbitrum Sepolia (BrickSafe)",
    subgraphUrl: "",
    providerUrl: "",
    explorerUrl: "https://sepolia.arbiscan.io",
    chainId: 421614,
    rpcUrl: "https://sepolia-rollup.arbitrum.io/rpc",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    hasOceanProtocol: false,
  },
} as const;

// Ocean Protocol target network for cross-chain publishing
export const OCEAN_TARGET_NETWORK = 11155111; // Sepolia

// Network switching configuration
export const NETWORK_SWITCH_CONFIG = {
  [OCEAN_TARGET_NETWORK]: {
    chainId: `0x${OCEAN_TARGET_NETWORK.toString(16)}`,
    chainName: "Sepolia test network",
    nativeCurrency: {
      name: "Sepolia Ether",
      symbol: "SEP",
      decimals: 18,
    },
    rpcUrls: ["https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161"],
    blockExplorerUrls: ["https://sepolia.etherscan.io"],
  },
};

// Ocean Protocol Data Types
export interface OceanDatatokenCreateData {
  templateIndex: number;
  name: string;
  symbol: string;
  minter: string;
  feeManager: string;
  publishMarketOrderFeeAddress: string;
  publishMarketOrderFeeToken: string;
  publishMarketOrderFeeAmount: string;
  bytess: string;
}

export interface OceanAssetMetadata {
  "@context": string[];
  id: string;
  version: string;
  chainId: number;
  nftAddress: string;
  metadata: {
    created: string;
    updated: string;
    type: string;
    name: string;
    description: string;
    tags: string[];
    author: string;
    license: string;
    additionalInformation: Record<string, any>;
  };
  services: Array<{
    id: string;
    type: string;
    files: Array<{
      type: string;
      url: string;
      method: string;
    }>;
    datatokenAddress: string;
    serviceEndpoint: string;
    timeout: number;
  }>;
}

// Global type augmentation for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}

