import { useCallback, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, MotionConfig } from 'framer-motion';
import SmoothScroll from './lib/SmoothScroll';
import { useLenis, scrollToTarget } from './lib/lenis';
import { IntroContext } from './lib/intro';
import Loader from './components/Loader';
import Cursor from './components/Cursor';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileDock from './components/MobileDock';
import Home from './pages/Home';
import Projects from './pages/Projects';
import ProjectGallery from './pages/ProjectGallery';
import Consultation from './pages/Consultation';

function AnimatedRoutes() {
  const location = useLocation();
  const lenis = useLenis();

  return (
    <AnimatePresence mode="wait" onExitComplete={() => scrollToTarget(lenis, 'top', { immediate: true })}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Navigate to="/projects/residential" replace />} />
        <Route path="/projects/:category" element={<Projects />} />
        <Route path="/projects/:category/:slug" element={<ProjectGallery />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <SmoothScroll>
          <IntroContext.Provider value={introDone}>
            <AnimatePresence>{!introDone && <Loader key="loader" onDone={finishIntro} />}</AnimatePresence>
            <Cursor />
            <div className="grain" aria-hidden="true" />
            <Navbar />
            <main>
              <AnimatedRoutes />
            </main>
            <Footer />
            <MobileDock />
          </IntroContext.Provider>
        </SmoothScroll>
      </BrowserRouter>
    </MotionConfig>
  );
}
