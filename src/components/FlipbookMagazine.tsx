
import React from "react";

export default function FlipbookMagazine() {
  return (
    <section
      id="flipbook-showcase-section"
      className="w-full max-w-4xl mx-auto my-12 px-2 sm:px-4"
    >
      {/* Section Header */}
      <div className="text-center mb-6 space-y-2">
        <h2 className="font-halja text-3xl sm:text-4xl md:text-5xl text-white font-normal tracking-wide drop-shadow-[0_2px_10px_rgba(255,255,255,0.1)]">
          m i n i z i n e
        </h2>

        <p className="font-serif text-xs text-gray-400 max-w-xl mx-auto leading-relaxed">
          A teaser of the inaugural issue coming out on Friday the 13th, November 2026
        </p>
      </div>

      {/* Heyzine Flipbook */}
      <div className="w-full overflow-hidden rounded-lg">
        <iframe
          src="https://heyzine.com/flip-book/5cbba640de.html"
          title="MINIZINE - Digital Magazine"
          allowFullScreen
          allow="autoplay; fullscreen; clipboard-write"
          scrolling="no"
          className="w-full border border-gray-700 rounded-lg"
          style={{
            height: "650px",
            display: "block",
          }}
        />
      </div>
    </section>
  );
}
