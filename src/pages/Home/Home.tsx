import React, { useContext } from "react";
import { Container } from "@mui/material";
import { Button } from "src/components/ui/button";
import CreatePropertyForm from "src/components/CreatePropertyForm";
import PropertyList from "src/components/PropertyList";
import { WalletContext } from "src/context/WalletProvider";

const Home: React.FC = () => {
  const { connectWallet, currentAddress, displayAccount } = useContext(WalletContext);

  return (
    <Container maxWidth="xl" className="py-6">
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={connectWallet}>
          {currentAddress ? `Connected: ${displayAccount}` : "Connect Wallet"}
        </Button>
        <div className="bg-red-500 text-white px-3 py-2 rounded">Tailwind is working</div>
      </div>

      <CreatePropertyForm />
      <PropertyList />
    </Container>
  );
};

export default Home;
