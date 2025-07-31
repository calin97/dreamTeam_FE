import React, { useContext, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Typography } from "@mui/material";
import { Button } from "src/components/ui/button";
import { WalletContext } from "src/context/WalletProvider";
import frontendLibProperty from "src/assets/libs/frontendLibProperty";
import { createOceanProof } from "src/assets/libs/oceanProof"; // 👈 import ocean helper
import { toast } from "react-toastify";

const USDT_DECIMALS = 6;

export default function PropertyPage() {
  const { address: addrParam } = useParams<{ address: `0x${string}` }>();
  const navigate = useNavigate();
  const { signer, connectWallet, currentAddress, chainId, switchNetworkAsync } =
    useContext(WalletContext); // 👈 avem chainId & switchNetworkAsync

  const [summary, setSummary] = useState<any>(null);
  const [shares, setShares] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [contribAmount, setContribAmount] = useState("70000");
  const [rentAmount, setRentAmount] = useState("1000");
  const [displayName, setDisplayName] = useState("");

  const [isSeller, setIsSeller] = useState(false);
  const [isShareholder, setIsShareholder] = useState(false);

  // 👇 pentru Ocean
  const [oceanLoading, setOceanLoading] = useState(false);
  const OCEAN_CHAIN_ID = Number(import.meta.env.REACT_APP_OCEAN_CHAIN_ID);
  const ARB_CHAIN_ID = Number(import.meta.env.REACT_APP_ARB_CHAIN_ID) || chainId;

  const lib = useMemo(() => frontendLibProperty(), []);
  const propertyAddress = addrParam as `0x${string}`;
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
        const shFlag = await lib.isShareholder(
          signer.provider,
          propertyAddress,
          currentAddress
        );
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyAddress, signer?.provider, currentAddress]);

  async function doContribute() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }
      if (!usdtAddress) return;
      await lib.approveAndContribute(
        signer,
        propertyAddress,
        usdtAddress,
        Number(contribAmount)
      );
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
      await lib.depositIncome(
        signer,
        propertyAddress,
        usdtAddress,
        Number(rentAmount),
        true
      );
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Rent/distribute failed");
    }
  }

  async function doSetDisplayName(tokenId: number) {
    try {
      if (!signer || !displayName) return;
      await lib.setDisplayName(signer, propertyAddress, tokenId, displayName);
      setDisplayName("");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Set name failed");
    }
  }

  // ---------- Ocean proof ----------
  async function ensureChain(targetId: number) {
    if (!switchNetworkAsync) return true;
    if (chainId === targetId) return true;
    await switchNetworkAsync(targetId);
    return true;
  }

  async function doCreateOceanProof() {
    try {
      if (!signer) {
        await connectWallet();
        if (!signer) return;
      }
      if (!isShareholder) {
        toast.error("Doar un shareholder poate crea dovada.");
        return;
      }
      if (!OCEAN_CHAIN_ID) {
        toast.error("VITE_OCEAN_CHAIN_ID lipsă în .env.local");
        return;
      }
      setOceanLoading(true);
      const prev = chainId;

      // 1) Switch la rețeaua Ocean (ex. Polygon Amoy 80002)
      await ensureChain(OCEAN_CHAIN_ID);

      // 2) Creează DataNFT + DT + metadata (dovadă)
      const proof = {
        propertyAddress,
        contributor: currentAddress,
        when: new Date().toISOString(),
      };
      const { did, dataNftAddress } = await createOceanProof({
        ethersSigner: signer,
        contributor: currentAddress!,
        propertyAddress,
        proofJson: proof,
      });

      // 3) Înapoi pe Arbitrum
      await ensureChain(ARB_CHAIN_ID || prev!);

      // 4) Link DID + DataNFT în contractul BrickSafeProperty
      await lib.linkOceanAsset(signer, propertyAddress, did, dataNftAddress);

      toast.success("Ocean proof creat & link-uit cu succes");
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Create Ocean proof failed");
    } finally {
      setOceanLoading(false);
    }
  }

  return (
    <Container maxWidth="lg" className="py-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>← Back</Button>
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

              {/* Create Ocean Proof – doar shareholder și dacă nu e deja setat DID */}
              {isShareholder && !summary?.oceanDid && (
                <div className="mt-3">
                  <Button onClick={doCreateOceanProof} disabled={oceanLoading}>
                    {oceanLoading ? "Creating Ocean proof..." : "Create Ocean Proof"}
                  </Button>
                </div>
              )}
              {summary?.oceanDid && (
                <div className="mt-2 text-xs text-gray-600 break-all">
                  Ocean DID: {summary.oceanDid}<br />
                  DataNFT: {summary.oceanDataNft}
                </div>
              )}
            </div>
          </div>

          {/* CONTRIBUTE — ascuns pentru seller sau dacă deja e finalized */}
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

          {/* RENT — ascuns pentru seller */}
          {!isSeller && (
            <div className="mt-4 border rounded-2xl p-4">
              <div className="font-medium mb-2">Rent</div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="border rounded px-3 py-2 w-48"
                  placeholder="rent amount"
                />
                <Button onClick={doRentAndDistribute}>
                  Deposit & Distribute
                </Button>
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
                      <div>token #{s.tokenId} — {s.percent}%</div>
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
