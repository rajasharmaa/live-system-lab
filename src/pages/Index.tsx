import HeroSection from "@/components/HeroSection";
import TopicsRoadmap from "@/components/TopicsRoadmap";
import SystemArchitecture from "@/components/SystemArchitecture";
import TrafficSimulator from "@/components/TrafficSimulator";
import RealWorldSystemsDemo from "@/components/RealWorldSystemsDemo";
import CoreConceptsLab from "@/components/CoreConceptsLab";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <TopicsRoadmap />
      <SystemArchitecture />
      <TrafficSimulator />
      <RealWorldSystemsDemo />
      <CoreConceptsLab />
      
      <Footer />
    </div>
  );
};

export default Index;
