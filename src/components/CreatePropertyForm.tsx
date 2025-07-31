import React, { useMemo, useState, useContext } from "react";
import { TextField, Stack, Typography } from "@mui/material";
import { toast } from "react-toastify";
import frontendLibFactory from "src/assets/libs/frontendLibFactory";
import { Button } from "./ui/button";
import { WalletContext } from "src/context/WalletProvider";


const USDT_DECIMALS = 6;

export default function CreatePropertyForm() {
  const { signer, connectWallet, chainId, switchNetworkAsync } = useContext(WalletContext);
  const [price, setPrice] = useState("100000"); // whole units (ex: 100000 = 100k USDT)
  const [uri, setUri] = useState("ipfs://QmPropertyMeta");
  const [loading, setLoading] = useState(false);

  const factoryAddress = import.meta.env.REACT_APP_CONTRACT_FACTORY as `0x${string}` | undefined;

  console.log("factoryAddress", factoryAddress)
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
      if (!signer) { await connectWallet(); if (!signer) throw new Error("Wallet not connected."); }
      const ok = await ensureNetwork(); if (!ok) return;

      if (!price || Number(price) <= 0) throw new Error("Price must be > 0.");
      if (!uri) throw new Error("URI is required.");

      setLoading(true);
      const { propertyAddress, txHash } = await factoryLib.createProperty(
        signer,                
        factoryAddress,
        Number(price),
        uri
      );
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
    <div className="w-full max-w-2xl mx-auto my-6 rounded-2xl border p-6 shadow-sm">
      <Typography variant="h6" className="mb-3">Create Property</Typography>
      <Stack spacing={2}>
        <TextField
          label={`Price in USDT (whole units, decimals=${USDT_DECIMALS})`}
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          type="number"
          fullWidth
        />
        <TextField
          label="URI (ipfs://..., data:..., https://...)"
          value={uri}
          onChange={(e) => setUri(e.target.value)}
          fullWidth
        />
        <div className="flex items-center gap-3">
          <Button onClick={onCreate} disabled={loading}>
            {loading ? "Creating..." : "Create Property"}
          </Button>
          {requiredChainId && (
            <span className="text-xs text-gray-500">
              Current chain: {chainId ?? "?"} {chainId !== requiredChainId ? `(need ${requiredChainId})` : ""}
            </span>
          )}
        </div>
      </Stack>
    </div>
  );
}
