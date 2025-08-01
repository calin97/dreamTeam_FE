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
    <div className="min-h-screen flex flex-col">
      <Container maxWidth="xl" className="flex-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* Header Section */}
          <section className="py-12 text-center">
            <div className="max-w-4xl mx-auto mb-12">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-6">
                BrickSafe Platform
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Create and manage real estate investment opportunities with blockchain technology
              </p>
            </div>

            {/* Wallet Connection */}
            <div className="flex justify-center">
              <Card className="w-full max-w-2xl">
                <CardContent className="flex items-center justify-between p-8">
                  <div className="flex items-center space-x-4">
                    <div className={`w-4 h-4 rounded-full ${currentAddress ? "bg-green-500" : "bg-gray-400"}`}></div>
                    <span className="text-base font-medium text-gray-700">
                      {currentAddress ? "Wallet Connected" : "Wallet Disconnected"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button
                      onClick={connectWallet}
                      variant={currentAddress ? "outline" : "default"}
                      size="lg"
                      className={
                        currentAddress
                          ? "border-green-200 text-green-700 hover:bg-green-50"
                          : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                      }
                    >
                      {currentAddress ? `${displayAccount}` : "Connect Wallet"}
                    </Button>
                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm px-3 py-1">
                      Demo
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Create Property Section */}
          <section className="py-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Create New Property</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Launch your real estate investment opportunity and start building your portfolio
              </p>
            </div>
            <div className="flex justify-center">
              <CreatePropertyForm />
            </div>
          </section>

          {/* Divider */}
          <div className="py-12">
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-gradient-to-r from-orange-200 to-red-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-8 py-3 text-lg font-semibold text-gray-600 rounded-full border-2 border-gray-200 shadow-sm">
                  Available Properties
                </span>
              </div>
            </div>
          </div>

          {/* Property List Section */}
          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Property Portfolio</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Browse and invest in available real estate opportunities
              </p>
            </div>
            <div className="flex justify-center">
              <PropertyList />
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default Home;

