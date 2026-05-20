/**
 * WDG Videography - Portfolio Page
 * Noir Cinema Design — matching site aesthetic
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FilmGrainOverlay from "@/components/FilmGrainOverlay";
import SmoothScroll from "@/components/SmoothScroll";
import SEO from "@/components/SEO";

const videos = [
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/2b7aee6cb_cr_video1.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/60008351a_cr_video2.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/39cced02a_cr_video3.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/6aa368ac8_cr_video4.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/86fc5db2c_cr_video5.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/fdd304353_cr_video6.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
  {
    src: "https://base44.app/api/apps/6a0c1534017166f536b1ac32/files/mp/public/6a0c1534017166f536b1ac32/1aaea9a43_cr_video7.mp4",
    client: "Charles Russell Transport",
    category: "brand",
    label: "Brand Film",
  },
];

const categories = [
  { key: "all", label: "All Work" },
  { key: "brand", label: "Brand Films" },
  { key: "social", label: "Social Content" },
  { key: "promo", label: "Promotional" },
];

export default function Portfolio() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [lightboxVideo, setLightboxVideo] = useState<string | null>(null);
  const lbRef = useRef<HTMLVideoElement>(null);

  const filtered = activeFilter === "all"
    ? videos
    : videos.filter((v) => v.category === activeFilter);

  useEffect(() => {
    if (lightboxVideo && lbRef.current) {
      lbRef.current.src = lightboxVideo;
      lbRef.current.play();
    }
  }, [lightboxVideo]);

  const closeLightbox = () => {
    if (lbRef.current) {
      lbRef.current.pause();
      lbRef.current.src = "";
    }
    setLightboxVideo(null);
  };

  return (
    <>
      <SEO
        title="Portfolio | Cinematic Brand Films & Video Production"
        description="Browse WDG Videography's portfolio of cinematic brand films, social content, and promotional video production. Based in Cheltenham, serving businesses across the UK."
        keywords="videography portfolio, brand films Cheltenham, video production portfolio, cinematic video UK, WDG Videography"
        canonicalUrl="https://www.wdgvideography.com/portfolio"
      />

      <SmoothScroll>
        <div className="relative min-h-screen bg-background overflow-hidden">
          <FilmGrainOverlay />
          <Navbar />

          {/* Hero */}
          <section className="pt-40 pb-16 px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-3xl mx-auto"
            >
              <p className="text-xs font-body font-semibold tracking-[0.35em] uppercase text-gold mb-4">
                Our Work
              </p>
              <h1 className="font-display text-5xl md:text-7xl font-semibold text-foreground leading-tight mb-6">
                The Portfolio
              </h1>
              <p className="text-muted-foreground font-body text-lg leading-relaxed">
                Cinematic production for brands that mean business.
              </p>
            </motion.div>

            {/* Gold divider */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mx-auto mt-10 h-px w-24 bg-gradient-to-r from-transparent via-gold to-transparent"
            />
          </section>

          {/* Filter Tabs */}
          <section className="pb-12 px-6">
            <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveFilter(cat.key)}
                  className={`px-5 py-2 text-xs font-body font-semibold tracking-widest uppercase rounded-sm transition-all duration-300 ${
                    activeFilter === cat.key
                      ? "bg-gold text-primary-foreground shadow-[0_0_20px_oklch(0.78_0.12_75/0.3)]"
                      : "border border-border/40 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </section>

          {/* Video Grid */}
          <section className="pb-24 px-4 md:px-8">
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border/20 max-w-7xl mx-auto"
            >
              <AnimatePresence>
                {filtered.map((video, i) => (
                  <PortfolioCard
                    key={video.src}
                    video={video}
                    index={i}
                    onOpen={() => setLightboxVideo(video.src)}
                  />
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <div className="col-span-3 py-32 text-center text-muted-foreground font-body">
                  No work in this category yet — check back soon.
                </div>
              )}
            </motion.div>
          </section>

          <Footer />
        </div>
      </SmoothScroll>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={closeLightbox}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl aspect-video bg-black rounded-sm overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]"
            >
              <video
                ref={lbRef}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-gold transition-colors duration-200 text-lg"
              >
                ×
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function PortfolioCard({
  video,
  index,
  onOpen,
}: {
  video: (typeof videos)[0];
  index: number;
  onOpen: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="relative bg-background aspect-[16/10] overflow-hidden cursor-pointer group"
      onClick={onOpen}
      onMouseEnter={() => videoRef.current?.play()}
      onMouseLeave={() => {
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.currentTime = 0;
        }
      }}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      >
        <source src={video.src} type="video/mp4" />
      </video>

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-350 flex flex-col justify-end p-6 z-10">
        <p className="font-display text-xl text-foreground font-medium mb-1">
          {video.client}
        </p>
        <p className="text-xs font-body font-semibold tracking-[0.3em] uppercase text-gold">
          {video.label}
        </p>
      </div>

      {/* Play Button */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="w-14 h-14 rounded-full border border-gold/60 flex items-center justify-center bg-black/40 backdrop-blur-sm group-hover:border-gold transition-colors duration-300">
          <svg className="w-5 h-5 text-gold ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
