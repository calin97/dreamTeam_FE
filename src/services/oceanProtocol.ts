import { Signer } from "ethers";
import { toast } from "react-toastify";

// Simplified Ocean Protocol configuration for different networks
const OCEAN_CONFIGS = {
  // Arbitrum Sepolia
  421614: {
    nodeUri: "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUri: "https://sepolia.arbiscan.io",
    oceanMarketUri: "https://market.oceanprotocol.com",
    chainId: 421614,
    network: "arbitrum-sepolia",
  },
  // Arbitrum One
  42161: {
    nodeUri: "https://arb1.arbitrum.io/rpc",
    explorerUri: "https://arbiscan.io",
    oceanMarketUri: "https://market.oceanprotocol.com",
    chainId: 42161,
    network: "arbitrum",
  },
};

export interface PropertyNFTData {
  name: string;
  description: string;
  propertyAddress: string;
  seller: string;
  price: string;
  raised: string;
  totalShares: number;
  propertyURI?: string;
  metadata?: any;
}

export interface OceanPublishResult {
  nftAddress: string;
  datatokenAddress: string;
  did: string;
  txHash: string;
}

class OceanProtocolService {
  private chainId: number | null = null;

  /**
   * Initialize Ocean Protocol for the current network
   */
  async initialize(signer: Signer): Promise<void> {
    try {
      const network = await signer.provider?.getNetwork();
      if (!network) throw new Error("Provider not available");

      this.chainId = network.chainId;
      const config = OCEAN_CONFIGS[this.chainId as keyof typeof OCEAN_CONFIGS];

      if (!config) {
        throw new Error(`Ocean Protocol not supported on chain ${this.chainId}`);
      }

      console.log("Ocean Protocol initialized for network:", config.network);
    } catch (error) {
      console.error("Failed to initialize Ocean Protocol:", error);
      throw error;
    }
  }

  /**
   * Simulate publishing property data as NFT on Ocean Protocol
   * Note: This is a simplified implementation that simulates the Ocean Protocol workflow
   */
  async publishPropertyNFT(signer: Signer, propertyData: PropertyNFTData): Promise<OceanPublishResult> {
    if (!this.chainId) {
      await this.initialize(signer);
    }

    if (!this.chainId) {
      throw new Error("Ocean Protocol not initialized");
    }

    try {
      const publisherAccount = await signer.getAddress();

      console.log("Publishing property on Ocean Protocol...", {
        propertyAddress: propertyData.propertyAddress,
        seller: propertyData.seller,
        publisher: publisherAccount,
      });

      // Create a simulated Ocean Protocol asset
      const assetMetadata = {
        name: `BrickSafe Property: ${propertyData.name}`,
        description: propertyData.description,
        image: propertyData.propertyURI || "",
        external_url: `https://bricksafe.io/property/${propertyData.propertyAddress}`,
        attributes: [
          {
            trait_type: "Property Address",
            value: propertyData.propertyAddress,
          },
          {
            trait_type: "Seller",
            value: propertyData.seller,
          },
          {
            trait_type: "Original Price",
            value: `${propertyData.price} USDT`,
          },
          {
            trait_type: "Total Raised",
            value: `${propertyData.raised} USDT`,
          },
          {
            trait_type: "Total Shares",
            value: propertyData.totalShares.toString(),
          },
          {
            trait_type: "Platform",
            value: "BrickSafe",
          },
          {
            trait_type: "Chain ID",
            value: this.chainId.toString(),
          },
        ],
      };

      // In a full implementation, this would create an actual NFT and datatoken
      // For now, we simulate the process and generate mock addresses
      const mockNftAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const mockDatatokenAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const did = `did:op:${mockNftAddress}`;

      // Store the metadata in localStorage for demonstration
      const oceanAsset = {
        did,
        nftAddress: mockNftAddress,
        datatokenAddress: mockDatatokenAddress,
        metadata: assetMetadata,
        propertyData,
        publishedAt: new Date().toISOString(),
        publisher: publisherAccount,
        chainId: this.chainId,
      };

      localStorage.setItem(`ocean_asset_${propertyData.propertyAddress}`, JSON.stringify(oceanAsset));

      console.log("Property NFT published successfully (simulated):", {
        nftAddress: mockNftAddress,
        datatokenAddress: mockDatatokenAddress,
        did,
      });

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return {
        nftAddress: mockNftAddress,
        datatokenAddress: mockDatatokenAddress,
        did,
        txHash: mockTxHash,
      };
    } catch (error) {
      console.error("Failed to publish property NFT:", error);
      throw error;
    }
  }

  /**
   * Check if Ocean Protocol is available for current network
   */
  isNetworkSupported(chainId: number): boolean {
    return chainId in OCEAN_CONFIGS;
  }

  /**
   * Get Ocean Protocol config for current network
   */
  getNetworkConfig(chainId: number) {
    return OCEAN_CONFIGS[chainId as keyof typeof OCEAN_CONFIGS];
  }

  /**
   * Get published asset data from localStorage
   */
  getPublishedAsset(propertyAddress: string) {
    const stored = localStorage.getItem(`ocean_asset_${propertyAddress}`);
    return stored ? JSON.parse(stored) : null;
  }
}

export const oceanProtocolService = new OceanProtocolService();

/**
 * Helper function to publish property as NFT on Ocean Protocol
 */
export async function publishPropertyOnOcean(
  signer: Signer,
  propertyData: PropertyNFTData
): Promise<OceanPublishResult> {
  try {
    const result = await oceanProtocolService.publishPropertyNFT(signer, propertyData);
    toast.success("Property published on Ocean Protocol successfully!");
    return result;
  } catch (error: any) {
    console.error("Ocean Protocol publish error:", error);
    toast.error(error?.message || "Failed to publish on Ocean Protocol");
    throw error;
  }
}

/**
 * Check if a property has already been published on Ocean Protocol
 */
export function isPropertyPublishedOnOcean(propertyAddress: string): boolean {
  return !!oceanProtocolService.getPublishedAsset(propertyAddress);
}

/**
 * Get published Ocean Protocol asset data for a property
 */
export function getOceanAssetData(propertyAddress: string) {
  return oceanProtocolService.getPublishedAsset(propertyAddress);
}

