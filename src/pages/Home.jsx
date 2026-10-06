import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Marquee from '../components/Marquee';
import Hero from '../sections/Hero';
import Studio from '../sections/Studio';
import Portfolio from '../sections/Portfolio';
import Services from '../sections/Services';
import Process from '../sections/Process';
import Testimonials from '../sections/Testimonials';
import Contact from '../sections/Contact';
import { useLenis, scrollToTarget } from '../lib/lenis';

export default function Home() {
  const location = useLocation();
  const navigate = useNavigate();
  const lenis = useLenis();

  // Arriving from another page with a section to jump to (e.g. "Services").
  useEffect(() => {
    const section = location.state?.section;
    if (!section) return;
    const id = setTimeout(() => {
      scrollToTarget(lenis, section);
      navigate('.', { replace: true, state: null });
    }, 1100);
    return () => clearTimeout(id);
  }, [location.state, lenis, navigate]);

  useEffect(() => {
    document.title = 'Anvee Interiors — Residential & Commercial Interior Design';
  }, []);

  return (
    <PageTransition label="Anvee Interiors">
      <div className="home-intro">
        <Hero />
        <Marquee items={['Residential', 'Commercial', 'Hospitality', 'Turnkey', 'Bespoke Furniture', 'Styling']} />
      </div>
      <Portfolio />
      <Services />
      <Process />
      <Studio />
      <Testimonials />
      <Contact />
    </PageTransition>
  );
}
