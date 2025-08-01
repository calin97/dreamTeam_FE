import { useEffect, useMemo, useState, useContext } from "react";
import { Skeleton } from "@mui/material";
import { formatUnits } from "ethers/lib/utils";
import { providers } from "ethers";
import { WalletContext } from "src/context/WalletProvider";
import frontendLibFactory from "src/assets/libs/frontendLibFactory";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { useNavigate } from "react-router-dom";

type UIProperty = {
  id: number;
  address: string;
  lister: string;
  price: any; // BigNumber
  uri: string;
};

const USDT_DECIMALS = 6;

export default function PropertyList() {
  const { signer } = useContext(WalletContext);
  const [items, setItems] = useState<UIProperty[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const factoryAddress = import.meta.env.REACT_APP_CONTRACT_FACTORY as `0x${string}` | undefined;
  const rpcUrl = import.meta.env.REACT_APP_PUBLIC_RPC_URL as string | undefined;

  const factoryLib = useMemo(() => frontendLibFactory(), []);
  const readProvider = useMemo(() => {
    if (signer?.provider) return signer.provider as providers.Provider;
    if (rpcUrl) return new providers.JsonRpcProvider(rpcUrl);
    return undefined;
  }, [signer, rpcUrl]);

  async function loadAll() {
    if (!readProvider || !factoryAddress) return;
    setLoading(true);
    try {
      const list = await factoryLib.getAllPropertyInfo(readProvider, factoryAddress);
      setItems(list as UIProperty[]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    if (!readProvider || !factoryAddress) return;
    const un = factoryLib.onPropertyDeployed(readProvider, factoryAddress, loadAll);
    return () => {
      try {
        un?.();
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readProvider, factoryAddress]);

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <Card className="border-0 shadow-2xl bg-gradient-to-r from-orange-500 to-red-500">
          <CardContent className="flex items-center justify-between p-8">
            <div className="flex items-center space-x-6">
              <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
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
                <h1 className="text-3xl font-bold text-white">Property Portfolio</h1>
                <p className="text-orange-100 flex items-center">
                  <Badge className="bg-white/20 text-white border-white/30 mr-3">{items.length}</Badge>
                  {items.length === 1 ? "Property" : "Properties"} Available
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={loadAll}
              disabled={loading || !readProvider}
              className="bg-white/20 backdrop-blur-sm border-2 border-orange-300 text-white hover:bg-white/30 hover:border-orange-200 transition-all duration-300 font-semibold px-6 py-3"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  Refresh
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton variant="rectangular" height={200} />
              <CardContent className="p-6 space-y-4">
                <Skeleton variant="text" height={24} width="60%" />
                <Skeleton variant="text" height={20} width="80%" />
                <Skeleton variant="text" height={20} width="40%" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <Card className="py-20 px-8">
          <CardContent className="text-center">
            <div className="mb-8 mx-auto w-24 h-24 bg-gradient-to-r from-orange-100 to-red-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-700">No Properties Yet</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                Start building your real estate portfolio by creating your first property investment opportunity.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Properties Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((property) => (
            <Card
              key={`${property.address}-${property.id}`}
              className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
              onClick={() => navigate(`/property/${property.address}`)}
            >
              {/* Property Card Header */}
              <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 p-6 flex items-end">
                <div className="absolute top-4 right-4">
                  <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30">ID #{property.id}</Badge>
                </div>
                <div className="text-white">
                  <CardTitle className="text-xl font-bold mb-1 text-white">Property Investment</CardTitle>
                  <CardDescription className="text-orange-100">Real Estate Opportunity</CardDescription>
                </div>
                {/* Decorative elements */}
                <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full"></div>
              </div>

              {/* Property Details */}
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Address */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Contract Address</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{property.address}</p>
                    </div>
                  </div>

                  {/* Lister */}
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-red-100 to-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Property Lister</p>
                      <p className="text-sm font-mono text-gray-900 break-all">{property.lister}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                          Investment Price
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${formatUnits(property.price, USDT_DECIMALS)}
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white">USDT</Badge>
                    </CardContent>
                  </Card>

                  {/* URI */}
                  {property.uri && (
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Metadata URI</p>
                      <Badge variant="secondary" className="text-xs font-mono break-all">
                        {property.uri}
                      </Badge>
                    </div>
                  )}

                  {/* View Button */}
                  <div className="pt-4">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-2 border-white hover:border-yellow-300 font-medium py-3 transition-all duration-300 group-hover:shadow-lg">
                      <span className="mr-2">View Details</span>
                      <svg
                        className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

