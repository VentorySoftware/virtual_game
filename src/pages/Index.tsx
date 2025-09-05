import HeroSection from "@/components/sections/HeroSection"
import CategoriesSection from "@/components/sections/CategoriesSection"
import FeaturedProducts from "@/components/sections/FeaturedProducts"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

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
    </div>
  );
};

export default Index;
