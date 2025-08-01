import { Signer, Contract, utils } from "ethers";
import { toast } from "react-toastify";
import { OCEAN_NFT_FACTORY_ABI, OCEAN_DATA_NFT_ABI } from "../contracts/oceanProtocol";
import { OCEAN_PROTOCOL_CONTRACTS, OCEAN_NETWORKS } from "../config/constants/oceanProtocol";
import {
  OCEAN_TARGET_NETWORK,
  NETWORK_SWITCH_CONFIG,
  type OceanDatatokenCreateData,
  type OceanAssetMetadata,
} from "../config/constants/oceanProtocol";

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
  tokenId?: number;
  chainId: number;
}

/**
 * Cross-Chain Ocean Protocol Service
 *
 * This service handles cross-chain interaction:
 * 1. BrickSafe properties exist on Arbitrum
 * 2. Ocean Protocol publishing happens on Polygon
 * 3. Automatic network switching and asset creation
 */
class CrossChainOceanProtocolService {
  private originalChainId: number | null = null;

  /**
   * Check if user is on Ocean Protocol network
   */
  async isOnOceanNetwork(signer: Signer): Promise<boolean> {
    const network = await signer.provider?.getNetwork();
    return network?.chainId === OCEAN_TARGET_NETWORK;
  }

  /**
   * Switch to Ocean Protocol network (Polygon)
   */
  async switchToOceanNetwork(): Promise<boolean> {
    try {
      // Check if MetaMask is available
      if (!window.ethereum) {
        throw new Error("MetaMask is required for network switching");
      }

      const switchConfig = NETWORK_SWITCH_CONFIG[OCEAN_TARGET_NETWORK];

      try {
        // Try to switch to the network
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: switchConfig.chainId }],
        });

        toast.success("Switched to Polygon for Ocean Protocol publishing");
        return true;
      } catch (switchError: any) {
        // If network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [switchConfig],
            });

            toast.success("Added and switched to Polygon network");
            return true;
          } catch (addError) {
            throw new Error("Failed to add Polygon network to wallet");
          }
        }
        throw switchError;
      }
    } catch (error: any) {
      console.error("Failed to switch network:", error);
      toast.error(error?.message || "Failed to switch to Polygon network");
      return false;
    }
  }

  /**
   * Switch back to original network
   */
  async switchBackToOriginalNetwork(): Promise<void> {
    if (!this.originalChainId || !window.ethereum) return;

    try {
      const originalChainHex = `0x${this.originalChainId.toString(16)}`;
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: originalChainHex }],
      });

      toast.success("Switched back to original network");
    } catch (error) {
      console.error("Failed to switch back to original network:", error);
      toast.warning("Please manually switch back to your preferred network");
    }
  }

  /**
   * Create metadata for Ocean Protocol asset
   */
  private createAssetMetadata(
    propertyData: PropertyNFTData,
    nftAddress: string,
    datatokenAddress: string,
    originalChainId: number
  ): OceanAssetMetadata {
    const did = `did:op:${nftAddress}`;

    return {
      "@context": ["https://w3id.org/did/v1"],
      id: did,
      version: "4.1.0",
      chainId: OCEAN_TARGET_NETWORK,
      nftAddress,
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        type: "dataset",
        name: `BrickSafe Property: ${propertyData.name}`,
        description: `${
          propertyData.description
        }\n\nThis Ocean Protocol asset represents a finalized real estate property from BrickSafe platform. The original property contract is deployed on ${
          originalChainId === 42161 ? "Arbitrum One" : "Arbitrum Sepolia"
        }, while this NFT provides Ocean Protocol data access and monetization capabilities.`,
        tags: ["real-estate", "property", "investment", "bricksafe", "cross-chain", "arbitrum"],
        author: propertyData.seller,
        license: "https://creativecommons.org/licenses/by/4.0/",
        additionalInformation: {
          propertyAddress: propertyData.propertyAddress,
          originalChain: originalChainId === 42161 ? "Arbitrum One" : "Arbitrum Sepolia",
          originalChainId: originalChainId,
          seller: propertyData.seller,
          originalPrice: `${propertyData.price} USDT`,
          totalRaised: `${propertyData.raised} USDT`,
          totalShares: propertyData.totalShares,
          platform: "BrickSafe",
          publishingNetwork: "Polygon",
          crossChain: true,
          ...propertyData.metadata,
        },
      },
      services: [
        {
          id: "access",
          type: "access",
          files: [
            {
              type: "url",
              url: `https://api.bricksafe.io/property/${propertyData.propertyAddress}/cross-chain-data`,
              method: "GET",
            },
          ],
          datatokenAddress,
          serviceEndpoint:
            OCEAN_NETWORKS[OCEAN_TARGET_NETWORK]?.providerUrl || "https://v4.provider.polygon.oceanprotocol.com",
          timeout: 86400,
        },
      ],
    };
  }

  /**
   * Upload metadata to IPFS (simulated)
   */
  private async uploadMetadataToIPFS(metadata: any): Promise<string> {
    // In production, this would upload to IPFS
    const jsonString = JSON.stringify(metadata, null, 2);
    const base64 = btoa(jsonString);
    return `data:application/json;base64,${base64}`;
  }

  /**
   * Publish property NFT on Ocean Protocol (Cross-chain)
   */
  async publishPropertyNFT(signer: Signer, propertyData: PropertyNFTData): Promise<OceanPublishResult> {
    try {
      // Store original network
      const originalNetwork = await signer.provider?.getNetwork();
      this.originalChainId = originalNetwork?.chainId || null;

      // Check if we need to switch networks
      const isOnOceanNetwork = await this.isOnOceanNetwork(signer);

      if (!isOnOceanNetwork) {
        toast.info("Switching to Polygon network for Ocean Protocol publishing...");
        const switched = await this.switchToOceanNetwork();
        if (!switched) {
          throw new Error("Network switch required for Ocean Protocol publishing");
        }

        // Wait for network switch to complete and get new signer
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      const publisherAccount = await signer.getAddress();
      const contracts = OCEAN_PROTOCOL_CONTRACTS[OCEAN_TARGET_NETWORK];

      if (!contracts) {
        throw new Error("Ocean Protocol contracts not available on Polygon");
      }

      console.log("Creating cross-chain Ocean Protocol NFT...", {
        propertyAddress: propertyData.propertyAddress,
        originalChain: this.originalChainId,
        targetChain: OCEAN_TARGET_NETWORK,
        publisher: publisherAccount,
      });

      // Ensure proper address checksumming to prevent bad checksum errors
      const checksummedFactoryAddress = utils.getAddress(contracts.NFT_FACTORY);
      console.log("Using checksummed NFT Factory address:", checksummedFactoryAddress);

      // Create NFT Factory contract instance on Polygon
      const nftFactory = new Contract(checksummedFactoryAddress, OCEAN_NFT_FACTORY_ABI, signer);

      // Prepare NFT metadata with cross-chain information
      const nftMetadata = {
        name: `BrickSafe Property: ${propertyData.name}`,
        description: `Cross-chain Ocean Protocol asset for BrickSafe property ${propertyData.propertyAddress}`,
        image: propertyData.propertyURI || "https://bricksafe.io/images/property-placeholder.png",
        external_url: `https://bricksafe.io/property/${propertyData.propertyAddress}`,
        attributes: [
          { trait_type: "Property Address", value: propertyData.propertyAddress },
          {
            trait_type: "Original Chain",
            value: this.originalChainId === 42161 ? "Arbitrum One" : "Arbitrum Sepolia",
          },
          { trait_type: "Ocean Protocol Chain", value: "Polygon" },
          { trait_type: "Cross-Chain Asset", value: "true" },
          { trait_type: "Seller", value: propertyData.seller },
          { trait_type: "Original Price", value: `${propertyData.price} USDT` },
          { trait_type: "Total Raised", value: `${propertyData.raised} USDT` },
          { trait_type: "Total Shares", value: propertyData.totalShares.toString() },
          { trait_type: "Platform", value: "BrickSafe" },
        ],
      };

      // Upload NFT metadata
      const nftTokenURI = await this.uploadMetadataToIPFS(nftMetadata);

      // Step 1: Create NFT on Polygon
      toast.info("Creating NFT on Ocean Protocol (Polygon)...");
      const createNFTTx = await nftFactory.createNFT(
        `BrickSafe Cross-Chain Property NFT`,
        "BSXCHAIN",
        1, // templateIndex
        publisherAccount,
        nftTokenURI,
        true, // transferable
        publisherAccount
      );

      const nftReceipt = await createNFTTx.wait();

      // Extract NFT address from logs
      const nftCreatedEvent = nftReceipt.logs.find(
        (log: any) => log.topics[0] === utils.id("NFTCreated(address,address,string,address,string,bool,address)")
      );

      if (!nftCreatedEvent) {
        throw new Error("NFT creation failed - no NFT created event found");
      }

      const nftAddress = utils.getAddress("0x" + nftCreatedEvent.topics[1].slice(26));
      console.log("Cross-chain NFT created at address:", nftAddress);

      // Step 2: Create Datatoken
      toast.info("Creating datatoken for property access...");

      const datatokenData: OceanDatatokenCreateData = {
        templateIndex: 1,
        name: `${propertyData.name} Cross-Chain Access Token`,
        symbol: "BSXDT",
        minter: publisherAccount,
        feeManager: publisherAccount,
        publishMarketOrderFeeAddress: utils.getAddress(contracts.PROVIDER_FEE),
        publishMarketOrderFeeToken: utils.getAddress(contracts.ZERO_ADDRESS),
        publishMarketOrderFeeAmount: "0",
        bytess: "0x",
      };

      const createDatatokenTx = await nftFactory.createToken(nftAddress, datatokenData);
      const datatokenReceipt = await createDatatokenTx.wait();

      // Extract datatoken address
      const tokenCreatedEvent = datatokenReceipt.logs.find(
        (log: any) => log.topics[0] === utils.id("TokenCreated(address,address,string,address)")
      );

      if (!tokenCreatedEvent) {
        throw new Error("Datatoken creation failed");
      }

      const datatokenAddress = utils.getAddress("0x" + tokenCreatedEvent.topics[1].slice(26));
      console.log("Cross-chain datatoken created:", datatokenAddress);

      // Step 3: Create complete asset metadata
      const assetMetadata = this.createAssetMetadata(propertyData, nftAddress, datatokenAddress, this.originalChainId!);

      // Store cross-chain asset data
      const oceanAsset = {
        did: assetMetadata.id,
        nftAddress,
        datatokenAddress,
        metadata: assetMetadata,
        propertyData,
        publishedAt: new Date().toISOString(),
        publisher: publisherAccount,
        chainId: OCEAN_TARGET_NETWORK,
        originalChainId: this.originalChainId,
        txHash: createNFTTx.hash,
        crossChain: true,
      };

      // Store in localStorage with cross-chain key
      localStorage.setItem(`cross_chain_ocean_${propertyData.propertyAddress}`, JSON.stringify(oceanAsset));

      console.log("Cross-chain Ocean Protocol asset published successfully:", {
        nftAddress,
        datatokenAddress,
        did: assetMetadata.id,
        originalChain: this.originalChainId,
        oceanChain: OCEAN_TARGET_NETWORK,
      });

      toast.success("Cross-chain Ocean Protocol NFT published successfully!");

      return {
        nftAddress,
        datatokenAddress,
        did: assetMetadata.id,
        txHash: createNFTTx.hash,
        tokenId: 1,
        chainId: OCEAN_TARGET_NETWORK,
      };
    } catch (error) {
      console.error("Failed to publish cross-chain Ocean Protocol asset:", error);
      throw error;
    }
  }

  /**
   * Get published cross-chain asset data
   */
  getPublishedAsset(propertyAddress: string) {
    const stored = localStorage.getItem(`cross_chain_ocean_${propertyAddress}`);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Verify NFT exists on Polygon
   */
  async verifyNFTOnChain(signer: Signer, nftAddress: string, tokenId: number = 1): Promise<boolean> {
    try {
      // Ensure we're on Polygon for verification
      const network = await signer.provider?.getNetwork();
      if (network?.chainId !== OCEAN_TARGET_NETWORK) {
        await this.switchToOceanNetwork();
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      const checksummedNftAddress = utils.getAddress(nftAddress);
      const nftContract = new Contract(checksummedNftAddress, OCEAN_DATA_NFT_ABI, signer);
      const tokenURI = await nftContract.tokenURI(tokenId);
      return !!tokenURI;
    } catch (error) {
      console.error("Failed to verify cross-chain NFT:", error);
      return false;
    }
  }

  /**
   * Get Ocean Market URL
   */
  getOceanMarketUrl(nftAddress: string): string {
    return `https://market.oceanprotocol.com/asset/did:op:${nftAddress}`;
  }
}

export const crossChainOceanProtocolService = new CrossChainOceanProtocolService();

/**
 * Publish property on Ocean Protocol using cross-chain interaction
 */
export async function publishPropertyOnCrossChainOcean(
  signer: Signer,
  propertyData: PropertyNFTData
): Promise<OceanPublishResult> {
  try {
    const result = await crossChainOceanProtocolService.publishPropertyNFT(signer, propertyData);
    return result;
  } catch (error: any) {
    console.error("Cross-chain Ocean Protocol publish error:", error);
    toast.error(error?.message || "Failed to publish cross-chain Ocean Protocol NFT");
    throw error;
  }
}

/**
 * Check if property is published cross-chain
 */
export function isPropertyPublishedCrossChain(propertyAddress: string): boolean {
  return !!crossChainOceanProtocolService.getPublishedAsset(propertyAddress);
}

/**
 * Get cross-chain asset data
 */
export function getCrossChainAssetData(propertyAddress: string) {
  return crossChainOceanProtocolService.getPublishedAsset(propertyAddress);
}

/**
 * Verify cross-chain NFT
 */
export async function verifyCrossChainNFT(signer: Signer, propertyAddress: string): Promise<boolean> {
  const assetData = crossChainOceanProtocolService.getPublishedAsset(propertyAddress);
  if (!assetData) return false;

  return crossChainOceanProtocolService.verifyNFTOnChain(signer, assetData.nftAddress, assetData.tokenId || 1);
}

/**
 * Get cross-chain Ocean Market URL
 */
export function getCrossChainOceanMarketUrl(propertyAddress: string): string | null {
  const assetData = crossChainOceanProtocolService.getPublishedAsset(propertyAddress);
  if (!assetData) return null;

  return crossChainOceanProtocolService.getOceanMarketUrl(assetData.nftAddress);
}

/**
 * Switch back to original network after Ocean Protocol operations
 */
export async function switchBackToOriginalNetwork(): Promise<void> {
  await crossChainOceanProtocolService.switchBackToOriginalNetwork();
}

