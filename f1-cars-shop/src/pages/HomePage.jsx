import React, { useState } from "react";
import Hero from "../components/Hero";
import Products from "../components/Products";
import PrimaryButton from "../components/PrimaryButton";

function HomePage() {
  const [showMore, setShowMore] = useState(false);

  return (
    <main>
      <Hero />
      
      <section className="view-more-section" style={{ textAlign: 'center', padding: '20px' }}>
        <PrimaryButton 
          text={showMore ? "Show Less" : "F1 news"} 
          onClick={() => setShowMore(!showMore)} 
        />
        
        {showMore && (
          <div className="extra-content" style={{ marginTop: '20px' }}>
            <h2>Formula 1 News</h2>
            <p>F1 2026 will start soon with two new teams
                Audi and Cadillac will show their cars soon...
            </p>
          </div>
        )}
      </section>

      <Products />
    </main>
  );
}

export default HomePage;