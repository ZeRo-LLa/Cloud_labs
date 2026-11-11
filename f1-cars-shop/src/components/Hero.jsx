import React, { useState } from 'react';
import PrimaryButton from './PrimaryButton';

function Hero() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="hero">
      <h1>Unleash the Speed</h1>
      <p>Explore the cutting-edge technology of Formula 1 racing.</p>
      
      <PrimaryButton 
        text={isExpanded ? "Show Less" : "View More"} 
        onClick={() => setIsExpanded(!isExpanded)} 
      />

      {isExpanded && (
        <div className="extra-content">
          <h3>Why F1?</h3>
          <p>F1 cars are not just cars; they are space shuttles on wheels. Every curve is designed for maximum downforce.</p>
        </div>
      )}
    </section>
  );
}

export default Hero;