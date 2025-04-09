import React from "react";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-header">
        <h1>🎛️ Learn to DJ by Watching the Mix Happen</h1>
        <p>
          MixMap reverse-engineers DJ sets so you can visualize real techniques
          like bass cuts, filter sweeps, and fader moves — live, in sync with
          the music.
        </p>
        <a href="/app" className="launch-btn">🔥 Launch the App</a>
      </header>

      <section className="demo-section">
        <h2>🎥 See It In Action</h2>
        <div className="demo-placeholder">
          <p>[Demo GIF or Video Placeholder]</p>
        </div>
      </section>

      <section className="features-section">
        <h2>✅ Features</h2>
        <ul>
          <li><strong>👀 Real-time visualizer:</strong> Frequency energy displayed live.</li>
          <li><strong>🎧 DJ technique detection:</strong> See bass cuts, filter sweeps, and more.</li>
          <li><strong>🧠 Practice Mode:</strong> Hide events to train your ear.</li>
          <li><strong>☁️ Cloud sync:</strong> Save and access your mixes anywhere.</li>
          <li><strong>🕹️ Interactive playback:</strong> Follow the mix, second by second.</li>
        </ul>
      </section>

      <section className="cta-section">
        <h2>👤 Ready to mix with your eyes and ears?</h2>
        <a href="/app" className="launch-btn">🧪 Try MixMap (Free Beta)</a>
        <p>No downloads. Works in your browser.</p>
      </section>

      <footer className="footer">
        <p>Built with ❤️ by Will DiMaio</p>
        <div className="footer-links">
          <a href="https://github.com/willdimaio/mixmap">GitHub</a> | 
          <a href="mailto:willdimaio@gmail.com"> Contact</a>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage; 