import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography } from "@mui/material";
import { Button } from "src/components/ui/button";
import { WalletContext } from "src/context/WalletProvider";
import frontendLibProperty from "src/assets/libs/frontendLibProperty";
import { toast } from "react-toastify";
import { ARB_CHAIN_ID } from "src/config/constants";
import {
  publishPropertyOnOcean,
  isPropertyPublishedOnOcean,
  getOceanAssetData,
  getOceanMarketUrl,
  verifyOceanNFT,
  type PropertyNFTData,
} from "src/services/oceanProtocol";

export default function PropertyPage() {
  const { address: addrParam } = useParams<{ address: `0x${string}` }>();
  const navigate = useNavigate();
  const { signer, connectWallet, currentAddress, chainId, switchNetworkAsync } = useContext(WalletContext);

  const [summary, setSummary] = useState<any>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [contribAmount, setContribAmount] = useState("70000");
  const [rentAmount, setRentAmount] = useState("1000");
  const [displayName, setDisplayName] = useState("");

  const [isSeller, setIsSeller] = useState(false);
  const [isShareholder, setIsShareholder] = useState(false);

  // New state for distribute loading
  const [distLoading, setDistLoading] = useState(false);

  // Ocean Protocol publishing state
  const [oceanPublishing, setOceanPublishing] = useState(false);
  const [oceanPublished, setOceanPublished] = useState(false);
  const [oceanNftAddress, setOceanNftAddress] = useState<string | null>(null);
  const [oceanDatatokenAddress, setOceanDatatokenAddress] = useState<string | null>(null);
  const [oceanVerifying, setOceanVerifying] = useState(false);
  const [oceanVerified, setOceanVerified] = useState<boolean | null>(null);

  const lib = useMemo(() => frontendLibProperty(), []);
  const propertyAddress = addrParam as `0x${string}`;

  // Check if property is already published on Ocean Protocol
  useEffect(() => {
    if (propertyAddress) {
      const isPublished = isPropertyPublishedOnOcean(propertyAddress);
      setOceanPublished(isPublished);

      if (isPublished) {
        const assetData = getOceanAssetData(propertyAddress);
        setOceanNftAddress(assetData?.nftAddress || null);
        setOceanDatatokenAddress(assetData?.datatokenAddress || null);
      }
    }
  }, [propertyAddress]);

  // Verify Ocean Protocol NFT on chain
  const handleVerifyOceanNFT = async () => {
    if (!signer || !propertyAddress) return;

    try {
      setOceanVerifying(true);
      const verified = await verifyOceanNFT(signer, propertyAddress);
      setOceanVerified(verified);

      if (verified) {
        toast.success("Ocean Protocol NFT verified on-chain!");
      } else {
        toast.warning("Ocean Protocol NFT not found on-chain");
      }
    } catch (error: any) {
      console.error("Failed to verify Ocean NFT:", error);
      toast.error("Failed to verify NFT on-chain");
      setOceanVerified(false);
    } finally {
      setOceanVerifying(false);
    }
  };
  const usdtAddress = summary?.usdt as `0x${string}` | undefined;

  async function load() {
    if (!propertyAddress || !signer?.provider) return;
    setLoading(true);
    try {
      const s = await lib.getSummary(signer.provider, propertyAddress);
      const sh = await lib.getShares(signer.provider, propertyAddress);
      setSummary(s);
      setShares(sh);

      const sellerAddr = (s.seller || "").toLowerCase();
      const me = (currentAddress || "").toLowerCase();
      setIsSeller(!!me && me === sellerAddr);

      if (currentAddress) {
        const shFlag = await lib.isShareholder(signer.provider, propertyAddress, currentAddress);
        setIsShareholder(!!shFlag);
      } else {
        setIsShareholder(false);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();

    // subscribe to income events to auto-refresh
    if (signer?.provider && propertyAddress) {
      const offDep = lib.onIncomeDeposited(signer.provider, propertyAddress, () => load());
      const offDist = lib.onIncomeDistributed(signer.provider, propertyAddress, () => load());
      return () => {
        try {
          offDep?.();
          offDist?.();
        } catch {}
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyAddress, signer?.provider, currentAddress]);

  // ---------- Chain helper ----------
  async function ensureChain(targetId?: number | null) {
    if (!targetId) return true;
    if (!switchNetworkAsync) return true;
    if (chainId === targetId) return true;
    await switchNetworkAsync(targetId);
    return true;
  }

  // ---------- Actions ----------
  async function doContribute() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }
      if (!usdtAddress) return;

      await ensureChain(ARB_CHAIN_ID);
      await lib.approveAndContribute(signer, propertyAddress, usdtAddress, Number(contribAmount));
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Contribute failed");
    }
  }

  async function doRentAndDistribute() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }
      if (!usdtAddress) return;

      await ensureChain(ARB_CHAIN_ID);

      const autoDistribute = !!isShareholder; // only if caller is a shareholder
      await lib.depositIncome(signer, propertyAddress, usdtAddress, Number(rentAmount), autoDistribute);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Rent/distribute failed");
    }
  }

  async function doDistribute() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }
      await ensureChain(ARB_CHAIN_ID);
      setDistLoading(true);
      await lib.distributeIncome(signer, propertyAddress);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Distribute failed");
    } finally {
      setDistLoading(false);
    }
  }

  async function doSetDisplayName(tokenId: number) {
    try {
      if (!signer || !displayName) return;
      await ensureChain(ARB_CHAIN_ID);
      await lib.setDisplayName(signer, propertyAddress, tokenId, displayName);
      setDisplayName("");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Set name failed");
    }
  }

  async function doPublishOnOcean() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }

      if (!summary) {
        toast.error("Property data not loaded");
        return;
      }

      if (!summary.finalized) {
        toast.error("Property must be finalized to publish on Ocean Protocol");
        return;
      }

      setOceanPublishing(true);

      // Prepare property data for Ocean Protocol
      const propertyData: PropertyNFTData = {
        name: `Property at ${summary.address.slice(0, 10)}...`,
        description: `A finalized real estate property investment on BrickSafe. This NFT represents ownership data and investment information for the property at address ${summary.address}. Total investment raised: ${summary.raisedFormatted} USDT from ${summary.totalShares} share tokens.`,
        propertyAddress: summary.address,
        seller: summary.seller,
        price: summary.priceFormatted,
        raised: summary.raisedFormatted,
        totalShares: summary.totalShares,
        propertyURI: summary.propertyURI,
        metadata: {
          platform: "BrickSafe",
          finalized: summary.finalized,
          pendingIncome: summary.pendingIncomeFormatted,
          usdtAddress: summary.usdt,
          chainId: chainId,
          publishedAt: new Date().toISOString(),
        },
      };

      const result = await publishPropertyOnOcean(signer, propertyData);

      setOceanNftAddress(result.nftAddress);
      setOceanDatatokenAddress(result.datatokenAddress);
      setOceanPublished(true);
      setOceanVerified(true); // Just published, so it's verified

      toast.success(`Property published on Ocean Protocol! NFT: ${result.nftAddress.slice(0, 10)}...`);
    } catch (e: any) {
      console.error("Ocean Protocol publish error:", e);
      toast.error(e?.message ?? "Failed to publish on Ocean Protocol");
    } finally {
      setOceanPublishing(false);
    }
  }

  return (
    <Container maxWidth="lg" className="py-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        <Typography variant="h6">Property</Typography>
      </div>

      {!summary ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        <>
          {/* HERO */}
          <div className="flex gap-5">
            <div className="flex-1">
              <div className="text-sm break-all">Address: {summary.address}</div>
              <div className="text-sm break-all">USDT: {summary.usdt}</div>
              <div className="text-sm break-all">Seller: {summary.seller}</div>
              <div className="mt-2">Price: {summary.priceFormatted} mUSDT</div>
              <div>Raised: {summary.raisedFormatted} mUSDT</div>
              <div>Finalized: {String(summary.finalized)}</div>
              <div>Pending income: {summary.pendingIncomeFormatted} mUSDT</div>

              <div className="mt-2 text-xs text-gray-600">
                Me isSeller: {String(isSeller)} · isShareholder: {String(isShareholder)}
              </div>
            </div>
          </div>

          {/* CONTRIBUTE — hidden for seller or if already finalized */}
          {!isSeller && !summary.finalized && (
            <div className="mt-6 border rounded-2xl p-4">
              <div className="font-medium mb-2">Contribute</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={contribAmount}
                  onChange={(e) => setContribAmount(e.target.value)}
                  className="border rounded px-3 py-2 w-48"
                  placeholder="amount (whole units)"
                />
                <Button onClick={doContribute}>Approve & Contribute</Button>
              </div>
            </div>
          )}

          {/* RENT — visible for everyone except seller */}
          {!isSeller && (
            <div className="mt-4 border rounded-2xl p-4">
              <div className="font-medium mb-2">Rent</div>
              <div className="text-sm text-gray-600 mb-2">
                Pending income in contract: <b>{summary.pendingIncomeFormatted}</b> mUSDT
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="border rounded px-3 py-2 w-48"
                  placeholder="rent amount"
                />
                <Button onClick={doRentAndDistribute}>Deposit & Distribute</Button>
              </div>
              {!isShareholder && (
                <div className="text-xs text-amber-700 mt-2">
                  You’re not a shareholder. Your deposit will be recorded as pending income. Any shareholder can later
                  trigger the distribution.
                </div>
              )}
            </div>
          )}

          {/* DISTRIBUTE — only for shareholders */}
          {isShareholder && summary?.finalized && (
            <div className="mt-4 border rounded-2xl p-4">
              <div className="font-medium mb-2">Distribute income</div>
              <div className="text-sm text-gray-600 mb-3">
                Pending income: <b>{summary.pendingIncomeFormatted}</b> mUSDT
              </div>
              <Button onClick={doDistribute} disabled={distLoading || summary.pendingIncomeFormatted === "0.0"}>
                {distLoading ? "Distributing…" : "Distribute to shareholders"}
              </Button>
            </div>
          )}

          {/* OCEAN PROTOCOL PUBLISHING — only when finalized */}
          {summary?.finalized && (
            <div className="mt-4 border rounded-2xl p-4 bg-gradient-to-r from-blue-50 to-cyan-50">
              <div className="font-medium mb-2 flex items-center gap-2">
                🌊 Ocean Protocol Integration
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">REAL</span>
              </div>
              <div className="text-sm text-gray-600 mb-3">
                Publish this finalized property as a real NFT on Ocean Protocol blockchain to enable secure data sharing
                and monetization.
              </div>

              {!oceanPublished ? (
                <Button
                  onClick={doPublishOnOcean}
                  disabled={oceanPublishing}
                  className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                >
                  {oceanPublishing ? "Creating NFT on Ocean Protocol..." : "🚀 Publish Real NFT on Ocean Protocol"}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600">
                    ✅ Successfully published on Ocean Protocol blockchain!
                  </div>

                  {/* NFT Address */}
                  {oceanNftAddress && (
                    <div className="text-sm space-y-1">
                      <div>
                        <span className="text-gray-600">NFT Contract: </span>
                        <a
                          href={`https://arbiscan.io/address/${oceanNftAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-600 hover:text-blue-800 break-all underline"
                        >
                          {oceanNftAddress}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Datatoken Address */}
                  {oceanDatatokenAddress && (
                    <div className="text-sm">
                      <span className="text-gray-600">Datatoken: </span>
                      <a
                        href={`https://arbiscan.io/address/${oceanDatatokenAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 hover:text-blue-800 break-all underline"
                      >
                        {oceanDatatokenAddress}
                      </a>
                    </div>
                  )}

                  {/* Verification Status */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleVerifyOceanNFT}
                      disabled={oceanVerifying || !signer}
                      className="text-xs"
                    >
                      {oceanVerifying ? "Verifying..." : "🔍 Verify On-Chain"}
                    </Button>

                    {oceanVerified === true && (
                      <span className="text-xs text-green-600 flex items-center gap-1">✅ Verified</span>
                    )}
                    {oceanVerified === false && (
                      <span className="text-xs text-red-600 flex items-center gap-1">❌ Not found</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const marketUrl = getOceanMarketUrl(propertyAddress);
                        if (marketUrl) window.open(marketUrl, "_blank");
                      }}
                      disabled={!oceanNftAddress}
                      className="text-sm"
                    >
                      🌐 View on Ocean Market
                    </Button>

                    {oceanNftAddress && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://arbiscan.io/address/${oceanNftAddress}`, "_blank")}
                        className="text-sm"
                      >
                        📊 View on Arbiscan
                      </Button>
                    )}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-3">
                <div className="font-medium mb-1">Real Ocean Protocol Features:</div>
                <ul className="list-disc list-inside space-y-1">
                  <li>Blockchain-verified NFT ownership</li>
                  <li>Datatoken-based access control</li>
                  <li>Decentralized data monetization</li>
                  <li>Integration with Ocean Market</li>
                </ul>
              </div>
            </div>
          )}

          {/* SHARES */}
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <Typography variant="subtitle1">Shares</Typography>
              <Button variant="outline" onClick={load} disabled={loading}>
                Refresh
              </Button>
            </div>
            {shares.length === 0 && <p className="text-gray-500 mt-2">No shares</p>}
            <div className="space-y-3 mt-2">
              {shares.map((s) => (
                <div key={s.tokenId} className="border rounded-xl p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <div>
                        token #{s.tokenId} — {s.percent}%
                      </div>
                      <div className="break-all">owner: {s.owner}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="display name"
                        className="border rounded px-2 py-1 text-sm"
                      />
                      <Button variant="outline" onClick={() => doSetDisplayName(s.tokenId)}>
                        Set name
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Container>
  );
}

