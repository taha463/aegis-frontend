import React from 'react';
import { Header, Hero, AboutUs, HowItWorks, Contact, Footer } from '../components/layout';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <Header />
      <main>
        <Hero />
        <AboutUs />
        <HowItWorks />
        <Contact />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
