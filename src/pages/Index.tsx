import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import WhatsAppWidget from "@/components/widgets/WhatsAppWidget"
import HeroSection from "@/components/sections/HeroSection"
import FeaturedProducts from "@/components/sections/FeaturedProducts"
import CategoriesSection from "@/components/sections/CategoriesSection"
import ReviewsList from "@/components/reviews/ReviewsList"

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground cyber-scrollbar">
      <Header />
      <main>
        <HeroSection />
        <FeaturedProducts />
        <CategoriesSection />
        
        {/* Sección de Reseñas de la Tienda */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-orbitron mb-4">
                💬 Lo que opinan los demás jugadores 🕹️
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Historias reales de gamers que confiaron en nosotros
              </p>
            </div>
            
            <ReviewsList 
              title="Reseñas de la Tienda"
              showForm={true}
            />
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppWidget />
    </div>
  );
};

export default Index;
