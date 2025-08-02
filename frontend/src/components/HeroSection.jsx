import { useState } from "react";
import { Link } from "react-router-dom";

function HeroSection() {

  return (
    <div className="min-h-[calc(100vh-73px)] bg-dark-900 text-dark-100 relative overflow-hidden">
      {/* Coral/orange glow effects */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary-500/15 blur-[100px] animate-pulse"></div>
      <div className="absolute top-1/2 -right-32 w-96 h-96 rounded-full bg-primary-500/10 blur-[120px] animate-pulse" style={{animationDelay: '1s'}}></div>
      <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-primary-500/10 blur-[80px] animate-pulse" style={{animationDelay: '2s'}}></div>
      
      <div className="container mx-auto px-4 py-20 relative z-10">
        {/* Main Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-20 relative">
          <h1 className="text-5xl md:text-6xl font-bold mb-8 text-dark-50 leading-tight">
            Monetize your skill.<br />Showcase your grind.
          </h1>

          <p className="text-lg text-dark-200 mb-8">
            Connect with the best talent and opportunities in the gaming industry.
          </p>
          <div className="flex justify-center gap-4 relative">
            <Link
              to="/signup"
              className="px-8 py-3 bg-primary-500 hover:bg-primary-600 text-dark-950 font-medium rounded-md transition-colors shadow-[0_0_20px_theme(colors.primary.500/40)] backdrop-blur-sm"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-dark-800 hover:bg-dark-700 text-dark-100 font-medium rounded-md transition-colors border border-dark-700"
            >
              Login
            </Link>
          </div>
        </section>

        {/* Featured Section */}
        <section className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto relative">
          <div className="bg-dark-950 p-6 rounded-lg border border-dark-800 hover:border-primary-500/30 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <div className="absolute -inset-1 bg-primary-500/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-dark-50 mb-4">For Players</h3>
              <p className="text-dark-200 mb-4">
                Showcase your skills, find teams, and get paid for your talent. Join a community that values your dedication.
              </p>
              <Link to="/signup" state={{ userType: 'player' }} className="text-primary-500 hover:underline font-medium"> {/* ADDED state prop */}
                Join as Player →
              </Link>
            </div>
          </div>
          <div className="bg-dark-950 p-6 rounded-lg border border-dark-800 hover:border-primary-500/30 transition-all duration-300 relative group overflow-hidden shadow-lg">
            <div className="absolute -inset-1 bg-primary-500/5 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative">
              <h3 className="text-xl font-semibold text-dark-50 mb-4">For Organizations</h3>
              <p className="text-dark-200 mb-4">
                Find the perfect talent for your team. Browse through skilled players and connect directly.
              </p>
              <Link to="/signup" state={{ userType: 'org' }} className="text-primary-500 hover:underline font-medium"> {/* ADDED state prop */}
                Join as Organization →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HeroSection;