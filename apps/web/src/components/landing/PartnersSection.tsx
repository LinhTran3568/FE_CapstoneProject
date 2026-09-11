import React from 'react';
import { motion } from 'motion/react';
import { MarqueeAlongSvgPath } from '../fancy/blocks/marquee-along-svg-path';
import './PartnersSection.css';

interface EventItem {
  title: string;
  img: string;
}

const eventList: EventItem[] = [
  {
    title: "Anh Trai Say Hi",
    img: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Vượt Ngàn Chông Gai",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "8Wonder Music Fest",
    img: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Hà Anh Tuấn — Storii",
    img: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Vũ. — Nuối Tiếc Tour",
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Monsoon Music Fest",
    img: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "GENfest City",
    img: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Thành Phố Mơ Màng",
    img: "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=300&auto=format&fit=crop&q=75"
  },
  {
    title: "Mori Live",
    img: "https://cdn.cosmos.so/79de41ec-baa4-4ac0-a9a4-c090005ca640?format=jpeg"
  },
  {
    title: "Ampersand Pass",
    img: "https://cdn.cosmos.so/1a18b312-21cd-4484-bce5-9fb7ed1c5e01?format=jpeg"
  },
  {
    title: "Cosmic Arena",
    img: "https://cdn.cosmos.so/d765f64f-7a66-462f-8b2d-3d7bc8d7db55?format=jpeg"
  },
  {
    title: "Typography Gala",
    img: "https://cdn.cosmos.so/6b9f08ea-f0c5-471f-a620-71221ff1fb65?format=jpeg"
  }
];

// Full-width edge-to-edge loop path (starts offscreen left at -120, finishes offscreen right at 1720)
// Tangents are mathematically continuous across all cubic Bezier segments
const waveLoopPath =
  "M -120 120 C -20 120, 151 133.31, 301 254.434 C 358.587 300.935, 687.926 370.938, 782.583 254.434 C 900.905 108.805, 825.516 1.779, 727.332 64.961 C 629.149 128.144, 652.902 287.723, 815.041 312.302 C 944.752 331.966, 1243.56 226.94, 1295 201.5 C 1455 122.37, 1580 90, 1720 70";

export const PartnersSection: React.FC = () => {
  return (
    <section className="partners-section" id="partners">
      {/* Centered Header */}
      <motion.div
        className="partners-header"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="partners-title">
          Các Bên <span className="partners-title-gradient">Liên Kết &amp; Đồng Hành</span>
        </h2>
      </motion.div>

      {/* Marquee Along SVG Path */}
      <motion.div
        className="partners-marquee-wrapper"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="partners-ambient-glow" />

        <MarqueeAlongSvgPath
          path={waveLoopPath}
          viewBox="0 0 1600 380"
          baseVelocity={4.2}
          slowdownOnHover={true}
          draggable={true}
          repeat={2}
          dragSensitivity={0.15}
          className="w-full h-full"
          responsive={true}
          grabCursor={true}
          enableRollingZIndex={true}
        >
          {eventList.map((event, index) => (
            <div key={index} className="event-square-card">
              <img
                src={event.img}
                alt={event.title}
                className="event-square-img"
                loading="lazy"
                decoding="async"
                draggable={false}
              />
              <div className="event-square-overlay">
                <span className="event-square-title">{event.title}</span>
              </div>
            </div>
          ))}
        </MarqueeAlongSvgPath>
      </motion.div>
    </section>
  );
};

export default PartnersSection;
