import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <main className="page-container about-page">
      <Helmet>
        <title>CeylonExplorer | About Us - Trusted Vehicle Rental Service</title>
        <meta name="description" content="Learn about CeylonExplorer, our mission, vision, and core values. We provide safe, reliable, and premium vehicle rental services in Sri Lanka." />
      </Helmet>
      <div className="page-hero">
        <div className="container">
          <h1>About CeylonExplorer</h1>
          <p>Your trusted partner for exploring the Pearl of the Indian Ocean</p>
        </div>
      </div>

      <div className="container">
        {/* Company Story */}
        <section className="about-section">
          <div className="about-content-grid">
            <div className="about-text">
              <h2>Our Story</h2>
              <p>
                Founded with a passion for showcasing the beauty of Sri Lanka, CeylonExplorer has been providing exceptional vehicle rental and tour services for travelers from around the world. We believe that the journey is just as important as the destination.
              </p>
              <p>
                Our fleet of well-maintained vehicles, ranging from compact cars to luxury vans, ensures that whether you're a solo traveler, couple, or large group, we have the perfect ride for your Sri Lankan adventure.
              </p>
              <p>
                With years of experience in the tourism industry, we understand what travelers need - reliable vehicles, transparent pricing, flexible booking options, and exceptional customer service. That's exactly what we deliver, every single time.
              </p>
            </div>
            <div className="about-image">
              <img src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop" alt="Sri Lanka landscape" />
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="mission-vision-section">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <div className="mv-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
                </svg>
              </div>
              <h3>Our Mission</h3>
              <p>
                To provide safe, comfortable, and affordable vehicle rental services that enable travelers to explore Sri Lanka with freedom and confidence. We're committed to making every journey memorable through quality service and genuine care.
              </p>
            </div>

            <div className="vision-card">
              <div className="mv-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4M12 8h.01"></path>
                </svg>
              </div>
              <h3>Our Vision</h3>
              <p>
                To be Sri Lanka's most trusted and preferred vehicle rental service, recognized for our exceptional fleet, customer-first approach, and contribution to sustainable tourism. We envision a future where every traveler experiences Sri Lanka to its fullest.
              </p>
            </div>
          </div>
        </section>

        {/* Why Choose Us */}
        <section className="why-choose-section-about">
          <h2>Why Travelers Choose Us</h2>
          <div className="benefits-grid">
            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 11l3 3L22 4"></path>
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                </svg>
              </div>
              <h4>Well-Maintained Fleet</h4>
              <p>All our vehicles undergo regular maintenance and safety checks to ensure a smooth, worry-free journey.</p>
            </div>

            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
              <h4>24/7 Customer Support</h4>
              <p>Our team is available round-the-clock to assist you with bookings, queries, or roadside assistance.</p>
            </div>

            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="1" x2="12" y2="23"></line>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
                </svg>
              </div>
              <h4>Transparent Pricing</h4>
              <p>No hidden fees or surprise charges. What you see is what you pay - simple and straightforward.</p>
            </div>

            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <h4>Island-Wide Service</h4>
              <p>Flexible pickup and drop-off locations across Sri Lanka, tailored to your travel plans.</p>
            </div>

            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <h4>Experienced Team</h4>
              <p>Our knowledgeable staff can provide travel tips and recommendations for your Sri Lankan adventure.</p>
            </div>

            <div className="benefit-card-about">
              <div className="benefit-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h4>Flexible Policies</h4>
              <p>Easy booking modifications and cancellation policies designed with your convenience in mind.</p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="values-section">
          <h2>Our Core Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <div className="value-number">01</div>
              <h4>Safety First</h4>
              <p>Your safety is our top priority. Every vehicle is inspected and equipped with safety features.</p>
            </div>
            <div className="value-item">
              <div className="value-number">02</div>
              <h4>Customer Satisfaction</h4>
              <p>We go above and beyond to ensure every customer has an exceptional experience with us.</p>
            </div>
            <div className="value-item">
              <div className="value-number">03</div>
              <h4>Integrity</h4>
              <p>Honest, transparent, and ethical in all our dealings - that's the CeylonExplorer way.</p>
            </div>
            <div className="value-item">
              <div className="value-number">04</div>
              <h4>Sustainability</h4>
              <p>We're committed to eco-friendly practices and supporting sustainable tourism in Sri Lanka.</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="about-cta-section">
          <div className="about-cta-card">
            <h2>Ready to Start Your Journey?</h2>
            <p>Explore Sri Lanka with confidence. Browse our fleet and book your vehicle today.</p>
            <div className="cta-buttons">
              <button className="btn-primary btn-large" onClick={() => navigate('/fleet')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"></path>
                  <polygon points="12 15 17 21 7 21 12 15"></polygon>
                </svg>
                View Our Fleet
              </button>
              <button className="btn-secondary btn-large" onClick={() => navigate('/contact')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Contact Us
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
