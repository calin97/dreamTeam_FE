import { useMemo, useState, useContext } from "react";
import { toast } from "react-toastify";
import frontendLibFactory from "src/assets/libs/frontendLibFactory";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { WalletContext } from "src/context/WalletProvider";

const USDT_DECIMALS = 6;

export default function CreatePropertyForm() {
  const { signer, connectWallet, chainId, switchNetworkAsync } = useContext(WalletContext);
  const [price, setPrice] = useState("100000");
  const [uri, setUri] = useState("ipfs://QmPropertyMeta");
  const [loading, setLoading] = useState(false);

  const factoryAddress = import.meta.env.REACT_APP_CONTRACT_FACTORY as `0x${string}` | undefined;

  console.log("factoryAddress", factoryAddress);
  const requiredChainId = useMemo(
    () => (process.env.NEXT_PUBLIC_CHAIN_ID ? Number(process.env.NEXT_PUBLIC_CHAIN_ID) : undefined),
    []
  );

  const factoryLib = useMemo(() => frontendLibFactory(), []);

  async function ensureNetwork() {
    if (!requiredChainId || !switchNetworkAsync) return true;
    if (chainId === requiredChainId) return true;
    try {
      await switchNetworkAsync(requiredChainId);
      return true;
    } catch {
      toast.error(`Please switch to chain ${requiredChainId}`);
      return false;
    }
  }

  async function onCreate() {
    try {
      if (!factoryAddress) throw new Error("Factory address missing in env.");
      if (!signer) {
        await connectWallet();
        if (!signer) throw new Error("Wallet not connected.");
      }
      const ok = await ensureNetwork();
      if (!ok) return;

      if (!price || Number(price) <= 0) throw new Error("Price must be > 0.");
      if (!uri) throw new Error("URI is required.");

      setLoading(true);
      const { propertyAddress, txHash } = await factoryLib.createProperty(signer, factoryAddress, Number(price), uri);
      toast.success(`Property created ${propertyAddress ? `@ ${propertyAddress}` : ""}`);
      console.log("createProperty tx:", txHash, "property:", propertyAddress);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Failed to create property");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="relative overflow-hidden border-0 shadow-2xl">
        {/* Gradient Border Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 p-1 rounded-3xl">
          <div className="bg-white rounded-3xl h-full w-full"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <CardHeader className="text-center space-y-6 px-8 pt-12 pb-8">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Create New Property
              </CardTitle>
              <CardDescription className="text-gray-600 text-lg">
                Launch your real estate investment opportunity
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-12">
            <div className="space-y-8">
              {/* Price Field */}
              <div className="space-y-3">
                <Label htmlFor="price" className="text-sm font-semibold text-gray-700">
                  Property Price (USDT)
                  <Badge variant="secondary" className="ml-2 text-xs">
                    decimals={USDT_DECIMALS}
                  </Badge>
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-orange-500 font-semibold text-lg">$</span>
                  </div>
                  <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="pl-8 pr-16 h-12 text-lg font-medium border-2 focus:border-orange-400 focus:ring-orange-100"
                    placeholder="100000"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">USDT</Badge>
                  </div>
                </div>
              </div>

              {/* URI Field */}
              <div className="space-y-3">
                <Label htmlFor="uri" className="text-sm font-semibold text-gray-700">
                  Property Metadata URI
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                  </div>
                  <Input
                    id="uri"
                    type="text"
                    value={uri}
                    onChange={(e) => setUri(e.target.value)}
                    className="pl-12 h-12 text-lg font-mono border-2 focus:border-red-400 focus:ring-red-100"
                    placeholder="ipfs://QmPropertyMeta"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                  Supports IPFS (ipfs://...), data URIs (data:...), or HTTPS URLs
                </p>
              </div>

              {/* Network Status */}
              {requiredChainId && (
                <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          chainId === requiredChainId ? "bg-green-500" : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm font-medium text-gray-700">Network: {chainId ?? "Disconnected"}</span>
                    </div>
                    {chainId !== requiredChainId && (
                      <Badge variant="destructive" className="text-xs">
                        Need Chain {requiredChainId}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Create Button */}
              <div className="pt-4">
                <Button
                  onClick={onCreate}
                  disabled={loading}
                  size="lg"
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-2 border-white hover:border-yellow-300 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Creating Property...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      Create Property
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-red-200 to-orange-200 rounded-full opacity-20 pointer-events-none"></div>
      </Card>
    </div>
  );
}

