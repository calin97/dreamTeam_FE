import React, { useEffect, useMemo, useState, useContext } from "react";
import { Typography, Skeleton } from "@mui/material";
import { formatUnits } from "ethers/lib/utils";
import { providers } from "ethers";
import { WalletContext } from "src/context/WalletProvider";
import frontendLibFactory from "src/assets/libs/frontendLibFactory";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";
// import { ipfsToHttp } from "src/utils/ipfs";

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
    return () => { try { un?.(); } catch {} };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readProvider, factoryAddress]);

  return (
    <div className="w-full max-w-5xl mx-auto my-6 rounded-2xl border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <Typography variant="h6">Properties</Typography>
        <Button variant="outline" onClick={loadAll} disabled={loading || !readProvider}>
          {loading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {loading && (
        <div className="space-y-3">
          <Skeleton variant="rectangular" height={64} />
          <Skeleton variant="rectangular" height={64} />
          <Skeleton variant="rectangular" height={64} />
        </div>
      )}

      {!loading && items.length === 0 && <p className="text-gray-500">No properties yet.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((p) => (
          <button
            key={`${p.address}-${p.id}`}
            onClick={() => navigate(`/property/${p.address}`)}
            className="text-left border rounded-2xl p-4 shadow-sm hover:shadow-md transition flex gap-3"
          >
            {/* thumbnail dacă p.uri e imagine ipfs */}
            {/* <img
              src={ipfsToHttp(p.uri)}
              alt=""
              className="w-20 h-20 object-cover rounded-lg border"
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            /> */}
            <div className="flex-1">
              <div className="text-sm text-gray-500 mb-1">ID #{p.id}</div>
              <div className="font-medium break-all mb-1">{p.address}</div>
              <div className="text-sm break-all">Lister: {p.lister}</div>
              <div className="text-sm">Price: {formatUnits(p.price, USDT_DECIMALS)} mUSDT</div>
              {p.uri && <div className="text-xs mt-1 break-all text-gray-500">URI: {p.uri}</div>}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
