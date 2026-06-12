import { Navigation } from '@/components/landing/navigation'
import { Footer } from '@/components/landing/footer'

export default function KenyaPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative h-[60vh] bg-gradient-to-br from-primary/20 to-accent/20">
          <div className="relative container mx-auto px-4 py-20 h-full flex items-center">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-bold text-foreground mb-4">
                Kenya
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                East Africa's Premier Logistics Hub
              </p>
              <div className="flex gap-4">
                <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 transition">
                  Get Started
                </button>
                <button className="border border-primary text-primary px-6 py-3 rounded-lg font-semibold hover:bg-primary/10 transition">
                  Learn More
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Experience Our Kenya Operations
            </h2>
            <div className="max-w-4xl mx-auto">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  controls
                  poster="/Artifacts/delivery.png"
                >
                  <source src="/Artifacts/Truck20004964.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Why Choose Kenya?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold text-foreground mb-3">Mombasa Port Access</h3>
                <p className="text-muted-foreground">
                  Direct access to Kenya's largest port and key East African gateway.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold text-foreground mb-3">Regional Connectivity</h3>
                <p className="text-muted-foreground">
                  Strategic hub serving Uganda, Tanzania, Rwanda, and neighboring countries.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <h3 className="text-xl font-semibold text-foreground mb-3">Tech-Enabled Solutions</h3>
                <p className="text-muted-foreground">
                  Advanced tracking and customs clearance systems for seamless operations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Additional Videos */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-foreground mb-8 text-center">
              Our Operations in Action
            </h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  controls
                >
                  <source src="/Artifacts/istockphoto-945121252-640_adpp_is.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video 
                  className="w-full h-full object-cover"
                  controls
                >
                  <source src="/Artifacts/Vans-2220419522-640_adpp_is.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Ship to/from Kenya?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Contact our Kenya team today for personalized logistics solutions.
            </p>
            <button className="bg-primary-foreground text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary-foreground/90 transition">
              Contact Us
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
