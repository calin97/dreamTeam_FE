import { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography } from "@mui/material";
import { Button } from "src/components/ui/button";
import { WalletContext } from "src/context/WalletProvider";
import frontendLibProperty from "src/assets/libs/frontendLibProperty";
import { toast } from "react-toastify";
import { ARB_CHAIN_ID } from "src/config/constants";
import {
  publishPropertyOnCrossChainOcean,
  isPropertyPublishedCrossChain,
  getCrossChainAssetData,
  getCrossChainOceanMarketUrl,
  verifyCrossChainNFT,
  switchBackToOriginalNetwork,
  type PropertyNFTData,
} from "src/services/crossChainOceanProtocol";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Badge } from "src/components/ui/badge";
import { Input } from "src/components/ui/input";
import { CardDescription } from "src/components/ui/card";
import { Label } from "src/components/ui/label";

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

  // Check if property is already published on Ocean Protocol (cross-chain)
  useEffect(() => {
    if (propertyAddress) {
      const isPublished = isPropertyPublishedCrossChain(propertyAddress);
      setOceanPublished(isPublished);

      if (isPublished) {
        const assetData = getCrossChainAssetData(propertyAddress);
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
      const verified = await verifyCrossChainNFT(signer, propertyAddress);
      setOceanVerified(verified);

      if (verified) {
        toast.success("Cross-chain Ocean Protocol NFT verified on Polygon!");
      } else {
        toast.warning("Ocean Protocol NFT not found on Polygon");
      }
    } catch (error: any) {
      console.error("Failed to verify cross-chain Ocean NFT:", error);
      toast.error("Failed to verify NFT on Polygon");
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

      const result = await publishPropertyOnCrossChainOcean(signer, propertyData);

      setOceanNftAddress(result.nftAddress);
      setOceanDatatokenAddress(result.datatokenAddress);
      setOceanPublished(true);
      setOceanVerified(true); // Just published, so it's verified

      toast.success(`Cross-chain Ocean Protocol NFT published! Address: ${result.nftAddress.slice(0, 10)}...`);

      // Offer to switch back to original network
      setTimeout(async () => {
        const switchBack = window.confirm("Would you like to switch back to your original network?");
        if (switchBack) {
          await switchBackToOriginalNetwork();
        }
      }, 3000);
    } catch (e: any) {
      console.error("Ocean Protocol publish error:", e);
      toast.error(e?.message ?? "Failed to publish on Ocean Protocol");
    } finally {
      setOceanPublishing(false);
    }
  }

  return (
    <div className="space-y-8">
      <Container maxWidth="lg" className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <section className="mb-8">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </Button>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Property Details
              </h1>
            </div>
            <div className="w-20"></div> {/* Spacer for center alignment */}
          </div>
        </section>

        {!summary ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading property details...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Property Summary Section */}
            <section>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Property Info */}
                <div className="space-y-6">
                  <Card className="p-6">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-xl font-bold text-gray-900">Property Information</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 space-y-4">
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Contract Address
                          </label>
                          <p className="text-sm font-mono text-gray-900 break-all mt-1">{summary.address}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            USDT Token
                          </label>
                          <p className="text-sm font-mono text-gray-900 break-all mt-1">{summary.usdt}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Seller</label>
                          <p className="text-sm font-mono text-gray-900 break-all mt-1">{summary.seller}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Financial Info */}
                <div className="space-y-6">
                  <Card className="p-6 bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                    <CardHeader className="px-0 pt-0">
                      <CardTitle className="text-xl font-bold text-gray-900">Financial Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="px-0 pb-0 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Price</label>
                          <p className="text-lg font-bold text-gray-900 mt-1">{summary.priceFormatted} USDT</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Raised</label>
                          <p className="text-lg font-bold text-green-600 mt-1">{summary.raisedFormatted} USDT</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</label>
                          <Badge className={`mt-1 ${summary.finalized ? "bg-green-500" : "bg-orange-500"} text-white`}>
                            {summary.finalized ? "Finalized" : "Active"}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Pending Income
                          </label>
                          <p className="text-lg font-bold text-blue-600 mt-1">{summary.pendingIncomeFormatted} USDT</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            {/* Shareholders Section */}
            {shares.length > 0 && (
              <section>
                <Card className="p-6">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Shareholders ({shares.length})</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                              Address
                            </th>
                            <th className="text-left py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                              Display Name
                            </th>
                            <th className="text-right py-3 text-sm font-medium text-gray-500 uppercase tracking-wide">
                              Shares
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {shares.map((share, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="py-3 text-sm font-mono text-gray-900">{share.holder}</td>
                              <td className="py-3 text-sm text-gray-900">{share.displayName || "—"}</td>
                              <td className="py-3 text-sm font-medium text-gray-900 text-right">
                                {share.sharesFormatted}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}

            {/* Actions Section */}
            <section className="space-y-6">
              {/* CONTRIBUTE - visible only if not finalized and not seller */}
              {!summary.finalized && !isSeller && (
                <Card className="p-6 border-green-200 bg-green-50">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Contribute to Property</CardTitle>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        type="number"
                        value={contribAmount}
                        onChange={(e) => setContribAmount(e.target.value)}
                        className="flex-1"
                        placeholder="Amount (whole units)"
                      />
                      <Button onClick={doContribute} className="bg-green-600 hover:bg-green-700">
                        Approve & Contribute
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* RENT - visible for everyone except seller */}
              {!isSeller && (
                <Card className="p-6 border-blue-200 bg-blue-50">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Deposit Rent</CardTitle>
                    <CardDescription className="text-blue-700">
                      Pending income in contract: <strong>{summary.pendingIncomeFormatted} USDT</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <Input
                        type="number"
                        value={rentAmount}
                        onChange={(e) => setRentAmount(e.target.value)}
                        className="flex-1"
                        placeholder="Rent amount"
                      />
                      <Button onClick={doRentAndDistribute} className="bg-blue-600 hover:bg-blue-700">
                        Deposit & Distribute
                      </Button>
                    </div>
                    {!isShareholder && (
                      <div className="text-sm text-amber-700 bg-amber-100 p-3 rounded-lg">
                        You're not a shareholder. Your deposit will be recorded as pending income. Any shareholder can
                        later trigger the distribution.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* DISTRIBUTE - only for shareholders */}
              {isShareholder && summary?.finalized && (
                <Card className="p-6 border-purple-200 bg-purple-50">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Distribute Income</CardTitle>
                    <CardDescription className="text-purple-700">
                      Pending income: <strong>{summary.pendingIncomeFormatted} USDT</strong>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <Button
                      onClick={doDistribute}
                      disabled={distLoading || summary.pendingIncomeFormatted === "0.0"}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {distLoading ? "Distributing…" : "Distribute to shareholders"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* DISPLAY NAME - only for shareholders */}
              {isShareholder && shares.some((s) => s.holder === currentAddress) && (
                <Card className="p-6 border-gray-200">
                  <CardHeader className="px-0 pt-0 pb-4">
                    <CardTitle className="text-lg font-semibold text-gray-900">Update Display Name</CardTitle>
                    <CardDescription>Update your display name for your shareholdings</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0 pb-0 space-y-4">
                    {shares
                      .filter((s) => s.holder === currentAddress)
                      .map((share, idx) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">Token #{share.tokenId}</p>
                              <p className="text-sm text-gray-600">
                                {share.sharesFormatted} shares ({share.percent}%)
                              </p>
                            </div>
                            <Badge variant="secondary">Your Share</Badge>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-4">
                            <Input
                              type="text"
                              value={displayName}
                              onChange={(e) => setDisplayName(e.target.value)}
                              className="flex-1"
                              placeholder="Your display name"
                            />
                            <Button onClick={() => doSetDisplayName(share.tokenId)} variant="outline">
                              Update Name
                            </Button>
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              )}
            </section>

            {/* Ocean Protocol Section */}
            {summary?.finalized && (
              <section>
                <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
                  <CardHeader className="px-0 pt-0 pb-6">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      🌊 Ocean Protocol Cross-Chain Publishing
                      <Badge className="bg-blue-100 text-blue-800">CROSS-CHAIN</Badge>
                      <Badge className="bg-purple-100 text-purple-800">POLYGON</Badge>
                    </CardTitle>
                    <CardDescription className="text-blue-700 leading-relaxed">
                      Publish this Arbitrum-based property as a real NFT on Ocean Protocol (Polygon network). This
                      creates cross-chain asset representation with low fees for secure data sharing and monetization.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="px-0 pb-0 space-y-6">
                    {!oceanPublished ? (
                      <Button
                        onClick={doPublishOnOcean}
                        disabled={oceanPublishing}
                        size="lg"
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                      >
                        {oceanPublishing ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                            Publishing Cross-Chain to Polygon...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            🌉 Publish Cross-Chain to Ocean Protocol
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Successfully published cross-chain to Ocean Protocol (Polygon)!
                        </div>

                        {/* NFT Address */}
                        {oceanNftAddress && (
                          <Card className="p-4 bg-white/80">
                            <CardContent className="p-0">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">NFT Contract (Polygon)</Label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 text-sm bg-gray-100 p-2 rounded break-all">
                                    {oceanNftAddress}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(`https://polygonscan.com/address/${oceanNftAddress}`, "_blank")
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Datatoken Address */}
                        {oceanDatatokenAddress && (
                          <Card className="p-4 bg-white/80">
                            <CardContent className="p-0">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Datatoken (Polygon)</Label>
                                <div className="flex items-center gap-2">
                                  <code className="flex-1 text-sm bg-gray-100 p-2 rounded break-all">
                                    {oceanDatatokenAddress}
                                  </code>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      window.open(`https://polygonscan.com/address/${oceanDatatokenAddress}`, "_blank")
                                    }
                                  >
                                    View
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={handleVerifyOceanNFT}
                            disabled={oceanVerifying || !signer}
                            size="sm"
                          >
                            {oceanVerifying ? (
                              <>
                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin mr-2"></div>
                                Verifying...
                              </>
                            ) : (
                              <>🔍 Verify on Polygon</>
                            )}
                          </Button>

                          {oceanVerified === true && (
                            <Badge className="bg-green-500 text-white">✅ Verified on Polygon</Badge>
                          )}

                          {oceanVerified === false && <Badge variant="destructive">❌ Not found on Polygon</Badge>}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const marketUrl = getCrossChainOceanMarketUrl(propertyAddress);
                              if (marketUrl) window.open(marketUrl, "_blank");
                            }}
                            disabled={!oceanNftAddress}
                          >
                            🌐 View on Ocean Market
                          </Button>

                          {oceanNftAddress && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                window.open(`https://polygonscan.com/address/${oceanNftAddress}`, "_blank")
                              }
                            >
                              📊 View on PolygonScan
                            </Button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Features List */}
                    <Card className="p-4 bg-white/60">
                      <CardContent className="p-0">
                        <div className="space-y-3">
                          <h4 className="font-medium text-gray-900">Cross-Chain Ocean Protocol Features:</h4>
                          <ul className="text-sm text-gray-600 space-y-2">
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                              Property on Arbitrum → NFT on Polygon
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-red-500 rounded-full"></div>
                              Low-cost Polygon transactions
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              Automatic network switching
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                              Real Ocean Protocol contracts
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              Cross-chain data monetization
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full"></div>
                              Ocean Market integration
                            </li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>
        )}
      </Container>
    </div>
  );
}

