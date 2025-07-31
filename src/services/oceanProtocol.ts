import { Signer, Contract, utils } from "ethers";
import { toast } from "react-toastify";
import {
  OCEAN_NFT_FACTORY_ABI,
  OCEAN_DATA_NFT_ABI,
  OCEAN_DATATOKEN_ABI,
  getOceanContracts,
  getOceanNetwork,
  type OceanNFTCreateData,
  type OceanDatatokenCreateData,
  type OceanAssetMetadata,
} from "../contracts/oceanProtocol";

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
      const contracts = getOceanContracts(this.chainId);

      if (!contracts) {
        throw new Error(`Ocean Protocol not supported on chain ${this.chainId}`);
      }

      console.log("Ocean Protocol initialized for network:", getOceanNetwork(this.chainId)?.name);
    } catch (error) {
      console.error("Failed to initialize Ocean Protocol:", error);
      throw error;
    }
  }

  /**
   * Create metadata for the Ocean Protocol asset
   */
  private createAssetMetadata(
    propertyData: PropertyNFTData,
    nftAddress: string,
    datatokenAddress: string
  ): OceanAssetMetadata {
    const did = `did:op:${nftAddress}`;

    return {
      "@context": ["https://w3id.org/did/v1"],
      id: did,
      version: "4.1.0",
      chainId: this.chainId!,
      nftAddress,
      metadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        type: "dataset",
        name: `BrickSafe Property: ${propertyData.name}`,
        description: propertyData.description,
        tags: ["real-estate", "property", "investment", "bricksafe", "tokenized"],
        author: propertyData.seller,
        license: "https://creativecommons.org/licenses/by/4.0/",
        additionalInformation: {
          propertyAddress: propertyData.propertyAddress,
          seller: propertyData.seller,
          originalPrice: `${propertyData.price} USDT`,
          totalRaised: `${propertyData.raised} USDT`,
          totalShares: propertyData.totalShares,
          platform: "BrickSafe",
          chainId: this.chainId,
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
              url: `https://api.bricksafe.io/property/${propertyData.propertyAddress}/data`,
              method: "GET",
            },
          ],
          datatokenAddress,
          serviceEndpoint: getOceanNetwork(this.chainId!)?.providerUrl || "https://provider.oceanprotocol.com",
          timeout: 86400,
        },
      ],
    };
  }

  /**
   * Upload metadata to IPFS (simulated for demo)
   */
  private async uploadMetadataToIPFS(metadata: OceanAssetMetadata): Promise<string> {
    // In a real implementation, this would upload to IPFS
    // For now, we'll simulate it by creating a data URI
    const jsonString = JSON.stringify(metadata, null, 2);
    const base64 = btoa(jsonString);
    return `data:application/json;base64,${base64}`;
  }

  /**
   * Create NFT and Datatoken on Ocean Protocol
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
      const contracts = getOceanContracts(this.chainId);

      if (!contracts) {
        throw new Error(`Ocean Protocol contracts not available for chain ${this.chainId}`);
      }

      console.log("Creating Ocean Protocol NFT and Datatoken...", {
        propertyAddress: propertyData.propertyAddress,
        seller: propertyData.seller,
        publisher: publisherAccount,
      });

      // Create NFT Factory contract instance
      const nftFactory = new Contract(contracts.NFT_FACTORY, OCEAN_NFT_FACTORY_ABI, signer);

      // Prepare NFT metadata
      const nftMetadata = {
        name: `BrickSafe Property: ${propertyData.name}`,
        description: propertyData.description,
        image: propertyData.propertyURI || "https://bricksafe.io/images/property-placeholder.png",
        external_url: `https://bricksafe.io/property/${propertyData.propertyAddress}`,
        attributes: [
          { trait_type: "Property Address", value: propertyData.propertyAddress },
          { trait_type: "Seller", value: propertyData.seller },
          { trait_type: "Original Price", value: `${propertyData.price} USDT` },
          { trait_type: "Total Raised", value: `${propertyData.raised} USDT` },
          { trait_type: "Total Shares", value: propertyData.totalShares.toString() },
          { trait_type: "Platform", value: "BrickSafe" },
          { trait_type: "Chain ID", value: this.chainId.toString() },
        ],
      };

      // Upload NFT metadata to IPFS (simulated)
      const nftTokenURI = await this.uploadMetadataToIPFS(nftMetadata as any);

      // Step 1: Create NFT
      console.log("Creating NFT...");
      const createNFTTx = await nftFactory.createNFT(
        `BrickSafe Property NFT`, // name
        "BSPROP", // symbol
        1, // templateIndex
        publisherAccount, // to
        nftTokenURI, // tokenURI
        true, // transferable
        publisherAccount // owner
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
      console.log("NFT created at address:", nftAddress);

      // Step 2: Create Datatoken
      console.log("Creating Datatoken...");

      const datatokenData: OceanDatatokenCreateData = {
        templateIndex: 1,
        name: `${propertyData.name} Data Access Token`,
        symbol: "BSPROPDT",
        minter: publisherAccount,
        feeManager: publisherAccount,
        publishMarketOrderFeeAddress: contracts.PROVIDER_FEE,
        publishMarketOrderFeeToken: contracts.ZERO_ADDRESS,
        publishMarketOrderFeeAmount: "0",
        bytess: "0x",
      };

      const createDatatokenTx = await nftFactory.createToken(nftAddress, datatokenData);
      const datatokenReceipt = await createDatatokenTx.wait();

      // Extract datatoken address from logs
      const tokenCreatedEvent = datatokenReceipt.logs.find(
        (log: any) => log.topics[0] === utils.id("TokenCreated(address,address,string,address)")
      );
      if (!tokenCreatedEvent) {
        throw new Error("Datatoken creation failed - no token created event found");
      }

      const datatokenAddress = utils.getAddress("0x" + tokenCreatedEvent.topics[1].slice(26));
      console.log("Datatoken created at address:", datatokenAddress);

      // Step 3: Create complete asset metadata
      const assetMetadata = this.createAssetMetadata(propertyData, nftAddress, datatokenAddress);
      const did = assetMetadata.id;

      // Step 4: Store asset data locally and on-chain metadata
      const oceanAsset = {
        did,
        nftAddress,
        datatokenAddress,
        metadata: assetMetadata,
        propertyData,
        publishedAt: new Date().toISOString(),
        publisher: publisherAccount,
        chainId: this.chainId,
        txHash: createNFTTx.hash,
      };

      // Store in localStorage for persistence
      localStorage.setItem(`ocean_asset_${propertyData.propertyAddress}`, JSON.stringify(oceanAsset));

      // Upload complete metadata to IPFS (simulated)
      const metadataURI = await this.uploadMetadataToIPFS(assetMetadata);

      // Update NFT with complete metadata
      const nftContract = new Contract(nftAddress, OCEAN_DATA_NFT_ABI, signer);
      try {
        // Mint a token with metadata (tokenId will be 1)
        const mintTx = await nftContract.safeMint(publisherAccount, metadataURI);
        await mintTx.wait();
        console.log("NFT minted with complete metadata");
      } catch (error) {
        console.warn("Failed to update NFT metadata, but asset creation succeeded:", error);
      }

      console.log("Ocean Protocol asset published successfully:", {
        nftAddress,
        datatokenAddress,
        did,
      });

      return {
        nftAddress,
        datatokenAddress,
        did,
        txHash: createNFTTx.hash,
        tokenId: 1,
      };
    } catch (error) {
      console.error("Failed to publish property NFT on Ocean Protocol:", error);
      throw error;
    }
  }

  /**
   * Check if Ocean Protocol is available for current network
   */
  isNetworkSupported(chainId: number): boolean {
    return !!getOceanContracts(chainId);
  }

  /**
   * Get Ocean Protocol config for current network
   */
  getNetworkConfig(chainId: number) {
    return getOceanNetwork(chainId);
  }

  /**
   * Get published asset data from localStorage
   */
  getPublishedAsset(propertyAddress: string) {
    const stored = localStorage.getItem(`ocean_asset_${propertyAddress}`);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Verify NFT exists on chain
   */
  async verifyNFTOnChain(signer: Signer, nftAddress: string, tokenId: number = 1): Promise<boolean> {
    try {
      const nftContract = new Contract(nftAddress, OCEAN_DATA_NFT_ABI, signer);
      const tokenURI = await nftContract.tokenURI(tokenId);
      return !!tokenURI;
    } catch (error) {
      console.error("Failed to verify NFT on chain:", error);
      return false;
    }
  }

  /**
   * Get Ocean Market URL for an asset
   */
  getOceanMarketUrl(nftAddress: string, chainId: number): string {
    return `https://market.oceanprotocol.com/asset/did:op:${nftAddress}`;
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

/**
 * Get Ocean Market URL for a published property
 */
export function getOceanMarketUrl(propertyAddress: string): string | null {
  const assetData = oceanProtocolService.getPublishedAsset(propertyAddress);
  if (!assetData) return null;

  return oceanProtocolService.getOceanMarketUrl(assetData.nftAddress, assetData.chainId);
}

/**
 * Verify if an Ocean Protocol NFT exists on chain
 */
export async function verifyOceanNFT(signer: Signer, propertyAddress: string): Promise<boolean> {
  const assetData = oceanProtocolService.getPublishedAsset(propertyAddress);
  if (!assetData) return false;

  return oceanProtocolService.verifyNFTOnChain(signer, assetData.nftAddress, assetData.tokenId || 1);
}

