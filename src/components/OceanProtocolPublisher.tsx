import React, { useState } from "react";
import { Button } from "./ui/button";
import { publishPropertyOnOcean, type PropertyNFTData } from "../services/oceanProtocol";
import { toast } from "react-toastify";
import { Signer } from "ethers";

interface OceanProtocolPublisherProps {
  signer: Signer | null;
  propertyData: PropertyNFTData;
  onPublished?: (nftAddress: string, did: string) => void;
  disabled?: boolean;
  className?: string;
}

export default function OceanProtocolPublisher({
  signer,
  propertyData,
  onPublished,
  disabled = false,
  className = "",
}: OceanProtocolPublisherProps) {
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [nftAddress, setNftAddress] = useState<string | null>(null);

  const handlePublish = async () => {
    if (!signer) {
      toast.error("Wallet not connected");
      return;
    }

    try {
      setPublishing(true);
      const result = await publishPropertyOnOcean(signer, propertyData);

      setNftAddress(result.nftAddress);
      setPublished(true);
      onPublished?.(result.nftAddress, result.did);
    } catch (error: any) {
      console.error("Ocean publish error:", error);
      toast.error(error?.message || "Failed to publish on Ocean Protocol");
    } finally {
      setPublishing(false);
    }
  };

  const handleViewOnMarket = () => {
    if (nftAddress) {
      window.open(`https://market.oceanprotocol.com/asset/${nftAddress}`, "_blank");
    }
  };

  return (
    <div className={`border rounded-2xl p-4 bg-gradient-to-r from-blue-50 to-cyan-50 ${className}`}>
      <div className="font-medium mb-2 flex items-center gap-2">🌊 Ocean Protocol Publishing</div>
      <div className="text-sm text-gray-600 mb-3">
        Publish this property as an NFT on Ocean Protocol to enable secure data sharing and monetization.
      </div>

      {!published ? (
        <Button
          onClick={handlePublish}
          disabled={disabled || publishing || !signer}
          className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
        >
          {publishing ? "Publishing on Ocean..." : "🚀 Publish on Ocean Protocol"}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-green-600">✅ Successfully published on Ocean Protocol!</div>
          {nftAddress && (
            <div className="text-sm">
              <span className="text-gray-600">NFT Address: </span>
              <span className="font-mono text-blue-600 break-all">{nftAddress}</span>
            </div>
          )}
          <Button variant="outline" onClick={handleViewOnMarket} disabled={!nftAddress} className="text-sm">
            View on Ocean Market
          </Button>
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Ocean Protocol enables secure data sharing and monetization through blockchain technology.
      </div>
    </div>
  );
}

