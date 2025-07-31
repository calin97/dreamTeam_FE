// Ocean Protocol Contract Addresses and ABIs for Arbitrum Networks

// Ocean Protocol NFT Factory ABI (simplified for key functions)
export const OCEAN_NFT_FACTORY_ABI = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "templateIndex",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
      {
        internalType: "bool",
        name: "transferable",
        type: "bool",
      },
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "createNFT",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "nftAddress",
        type: "address",
      },
      {
        components: [
          {
            internalType: "uint256",
            name: "templateIndex",
            type: "uint256",
          },
          {
            internalType: "string",
            name: "name",
            type: "string",
          },
          {
            internalType: "string",
            name: "symbol",
            type: "string",
          },
          {
            internalType: "address",
            name: "minter",
            type: "address",
          },
          {
            internalType: "address",
            name: "feeManager",
            type: "address",
          },
          {
            internalType: "address",
            name: "publishMarketOrderFeeAddress",
            type: "address",
          },
          {
            internalType: "address",
            name: "publishMarketOrderFeeToken",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "publishMarketOrderFeeAmount",
            type: "uint256",
          },
          {
            internalType: "bytes",
            name: "bytess",
            type: "bytes",
          },
        ],
        internalType: "struct NftCreateData",
        name: "nftCreateData",
        type: "tuple",
      },
    ],
    name: "createToken",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Ocean Protocol Data NFT ABI (simplified)
export const OCEAN_DATA_NFT_ABI = [
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
      {
        internalType: "string",
        name: "metaDataURI",
        type: "string",
      },
    ],
    name: "setTokenURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "tokenURI",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "string",
        name: "tokenURI",
        type: "string",
      },
    ],
    name: "safeMint",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Ocean Protocol Datatoken ABI (simplified)
export const OCEAN_DATATOKEN_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

// Ocean Protocol Contract Addresses for different networks
export const OCEAN_PROTOCOL_CONTRACTS = {
  // Arbitrum One (Mainnet)
  42161: {
    NFT_FACTORY: "0x7d46c74023507D30ccc2d3868129fbE4E400e40B",
    OCEAN_TOKEN: "0x933D9a4e4190Dd7F9B2c1C1b2F1A9a6a9C97A45f",
    FIXED_PRICE_EXCHANGE: "0x7339a3C27f2b15BeB6E0B7C01a5c2a78b8EC2a0b",
    PROVIDER_FEE: "0x0", // Zero address for no provider fees
    ZERO_ADDRESS: "0x0000000000000000000000000000000000000000",
  },
  // Arbitrum Sepolia (Testnet)
  421614: {
    NFT_FACTORY: "0x5c8e9EEc3e7a10A28E1e9e69c7F25e64F96F48c2",
    OCEAN_TOKEN: "0x4B8C8b16d2D9AaE5b1b9a5F8c1F2f8E8a8E7F6C8",
    FIXED_PRICE_EXCHANGE: "0x3C8E9EEc3e7a10A28E1e9e69c7F25e64F96F48c2",
    PROVIDER_FEE: "0x0",
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

// Ocean Protocol Data Types
export interface OceanNFTCreateData {
  templateIndex: number;
  name: string;
  symbol: string;
  to: string;
  tokenURI: string;
  transferable: boolean;
  owner: string;
}

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

// Helper function to get Ocean Protocol contracts for a specific chain
export function getOceanContracts(chainId: number) {
  return OCEAN_PROTOCOL_CONTRACTS[chainId as keyof typeof OCEAN_PROTOCOL_CONTRACTS];
}

// Helper function to get Ocean Protocol network configuration
export function getOceanNetwork(chainId: number) {
  return OCEAN_NETWORKS[chainId as keyof typeof OCEAN_NETWORKS];
}
