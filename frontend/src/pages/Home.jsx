import { useEffect } from 'react'; // ADDED useEffect
import { useNavigate } from 'react-router-dom'; // ADDED useNavigate
import HeroSection from '../components/HeroSection';
import Footer from '../components/Footer';
import { isAuthenticated, getUserType } from '../utils/auth'; // ADDED auth helpers

function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) {
      const userType = getUserType();
      if (userType === 'player') {
        navigate('/dashboard', { replace: true });
      } else if (userType === 'org') {
        navigate('/org-dashboard', { replace: true });
      }
    }
  }, [navigate]); // Dependency on navigate

  return (
    <>
      <HeroSection />
      <Footer />
    </>
  );
}

export default Home;