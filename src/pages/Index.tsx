import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import HealthDashboard from "@/components/HealthDashboard";
import CompatibilityGraph from "@/components/CompatibilityGraph";
import CodeGenerator from "@/components/CodeGenerator";
import DocSearch from "@/components/DocSearch";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />
      <HeroSection />
      <div className="divider-gradient" />
      <HealthDashboard />
      <div className="divider-gradient" />
      <CompatibilityGraph />
      <div className="divider-gradient" />
      <CodeGenerator />
      <div className="divider-gradient" />
      <DocSearch />
      <Footer />
    </div>
  );
};

export default Index;
