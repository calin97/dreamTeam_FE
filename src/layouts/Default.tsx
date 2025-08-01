import Navbar from "../components/Navbar/Navbar";
import { Outlet } from "react-router-dom";

const Default = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-red-50/30">
      <Navbar />
      <main className="pt-4 pb-12">
        <Outlet />
      </main>
    </div>
  );
};

export default Default;

