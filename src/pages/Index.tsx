import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import WhatsAppWidget from "@/components/widgets/WhatsAppWidget"
import HeroSection from "@/components/sections/HeroSection"
import FeaturedProducts from "@/components/sections/FeaturedProducts"
import CategoriesSection from "@/components/sections/CategoriesSection"

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground cyber-scrollbar">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoriesSection />
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
};

export default Index;
