import { useContext } from "react";
import { Container } from "@mui/material";
import { Button } from "src/components/ui/button";
import { Card, CardContent } from "src/components/ui/card";
import { Badge } from "src/components/ui/badge";
import CreatePropertyForm from "src/components/CreatePropertyForm";
import PropertyList from "src/components/PropertyList";
import { WalletContext } from "src/context/WalletProvider";

const Home: React.FC = () => {
  const { connectWallet, currentAddress, displayAccount } = useContext(WalletContext);

  return (
    <div className="space-y-8">
      <Container maxWidth="xl" className="px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <section className="py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
              BrickSafe Platform
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create and manage real estate investment opportunities with blockchain technology
            </p>
          </div>

          {/* Wallet Connection */}
          <Card className="max-w-lg mx-auto mb-8">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${currentAddress ? "bg-green-500" : "bg-gray-400"}`}></div>
                <span className="text-sm font-medium text-gray-700">
                  {currentAddress ? "Wallet Connected" : "Wallet Disconnected"}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={connectWallet}
                  variant={currentAddress ? "outline" : "default"}
                  className={
                    currentAddress
                      ? "border-green-200 text-green-700 hover:bg-green-50"
                      : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                  }
                >
                  {currentAddress ? `${displayAccount}` : "Connect Wallet"}
                </Button>
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white">Demo</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Create Property Section */}
        <section className="py-8">
          <CreatePropertyForm />
        </section>

        {/* Divider */}
        <div className="py-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gradient-to-r from-orange-200 to-red-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-6 py-2 text-sm font-medium text-gray-500 rounded-full border border-gray-200">
                Available Properties
              </span>
            </div>
          </div>
        </div>

        {/* Property List Section */}
        <section className="py-8">
          <PropertyList />
        </section>
      </Container>
    </div>
  );
};

export default Home;

