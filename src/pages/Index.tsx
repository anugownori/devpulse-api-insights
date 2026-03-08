import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HealthDashboard from "@/components/HealthDashboard";
import CompatibilityGraph from "@/components/CompatibilityGraph";
import CodeGenerator from "@/components/CodeGenerator";
import DocSearch from "@/components/DocSearch";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background grid-bg">
      <Navbar />
      <HeroSection />
      <HealthDashboard />
      <CompatibilityGraph />
      <CodeGenerator />
      <DocSearch />
      <Footer />
    </div>
  );
};

export default Index;
