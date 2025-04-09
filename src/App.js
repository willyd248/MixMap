import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Legend,
  Tooltip,
} from "chart.js";
import annotationPlugin from 'chartjs-plugin-annotation';
import { auth, provider, signInWithPopup, signOut, db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc,
  doc 
} from "firebase/firestore";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import LandingPage from "./LandingPage";

ChartJS.register(
  LineElement, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  Legend, 
  Tooltip,
  annotationPlugin
);

function MainApp() {
  const [chartData, setChartData] = useState(null);
  const [events, setEvents] = useState([]);
  const [audioSrc, setAudioSrc] = useState(null);
  const [cursorTime, setCursorTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savedMixes, setSavedMixes] = useState([]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [user, setUser] = useState(null);

  // Load saved mixes from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("mixmap_saves");
    if (saved) {
      setSavedMixes(JSON.parse(saved));
    }
  }, []);

  // Check for existing auth session
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      if (user) {
        loadUserMixes(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user's mixes from Firestore
  const loadUserMixes = async (userId) => {
    const q = query(collection(db, "mixes"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    const mixes = [];
    querySnapshot.forEach((doc) => {
      mixes.push({ id: doc.id, ...doc.data() });
    });
    setSavedMixes(mixes);
  };

  // Handle Google Sign In
  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      setUser(result.user);
      loadCloudMixes(result.user.uid);
    } catch (err) {
      console.error("Login failed", err);
    }
  };

  // Handle Sign Out
  const handleLogout = () => {
    signOut(auth);
    setUser(null);
    setSavedMixes([]);
  };

  // Update saveMix to use Firestore
  const saveMix = async () => {
    if (!user) {
      alert("Please login to save mixes");
      return;
    }

    const name = prompt("Name this mix:") || `Mix ${Date.now()}`;
    const mix = {
      name,
      timeline: chartData,
      events,
      createdAt: Date.now(),
      userId: user.uid
    };

    try {
      const docRef = await addDoc(collection(db, "mixes"), mix);
      const mixWithId = { id: docRef.id, ...mix };
      setSavedMixes([...savedMixes, mixWithId]);
      alert("Mix saved to cloud!");
    } catch (err) {
      console.error("Cloud save failed", err);
      alert("Failed to save mix");
    }
  };

  // Update deleteMix to use Firestore
  const deleteMix = async (mixId) => {
    try {
      await deleteDoc(doc(db, "mixes", mixId));
      const updated = savedMixes.filter((m) => m.id !== mixId);
      setSavedMixes(updated);
    } catch (error) {
      console.error("Error deleting mix:", error);
      alert("Failed to delete mix");
    }
  };

  const loadCloudMixes = async (uid) => {
    try {
      const q = query(collection(db, "mixes"), where("userId", "==", uid));
      const snapshot = await getDocs(q);
      const cloudMixes = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedMixes(cloudMixes);
    } catch (err) {
      console.error("Failed to load mixes", err);
    }
  };

  const loadMix = (mix) => {
    setChartData(mix.timeline);
    setEvents(mix.events);
    setCursorTime(0);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    const objectURL = URL.createObjectURL(file);
    setAudioSrc(objectURL);

    try {
      const res = await axios.post("http://localhost:8000/upload-analyze/", formData);
      const timeline = res.data.timeline;
      const events = res.data.events;

      const labels = timeline.map((point) => point.time);
      const low = timeline.map((point) => point.low);
      const mid = timeline.map((point) => point.mid);
      const high = timeline.map((point) => point.high);

      setChartData({
        labels,
        datasets: [
          {
            label: "Low (20-250 Hz)",
            data: low,
            borderColor: "blue",
            fill: false,
            tension: 0.2,
          },
          {
            label: "Mid (250-4k Hz)",
            data: mid,
            borderColor: "green",
            fill: false,
            tension: 0.2,
          },
          {
            label: "High (4k-20k Hz)",
            data: high,
            borderColor: "red",
            fill: false,
            tension: 0.2,
          },
        ],
      });

      setEvents(events);
    } catch (err) {
      console.error("Upload failed:", err);
    }

    setLoading(false);
  };

  // Update cursor position while playing
  useEffect(() => {
    if (audioRef.current) {
      const update = () => setCursorTime(audioRef.current.currentTime);
      intervalRef.current = setInterval(update, 100);
    }
    return () => clearInterval(intervalRef.current);
  }, [audioSrc]);

  return (
    <div style={{ padding: "2rem" }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "2rem",
        backgroundColor: "#f5f5f5",
        padding: "1rem",
        borderRadius: "8px"
      }}>
        <h1>🎚 MixMap Analyzer</h1>
        <div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontWeight: "500" }}>
                👤 {user.displayName || user.email}
              </span>
              <button 
                onClick={handleLogout}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  transition: "background-color 0.2s"
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button 
              onClick={handleLogin}
              style={{
                padding: "0.5rem 1rem",
                backgroundColor: "#4285f4",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s"
              }}
            >
              Login with Google
            </button>
          )}
        </div>
      </div>
      
      <div style={{ marginBottom: "1rem" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <input
            type="checkbox"
            checked={practiceMode}
            onChange={() => setPracticeMode(!practiceMode)}
          />
          🎓 Practice Mode (Hide DJ actions)
        </label>
      </div>

      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      
      {audioSrc && (
        <div style={{ marginTop: "1rem" }}>
          <audio ref={audioRef} controls src={audioSrc} />
        </div>
      )}

      <div style={{ margin: "1rem 0" }}>
        {chartData && <button onClick={saveMix}>💾 Save Mix</button>}
      </div>

      {savedMixes.length > 0 && (
        <div style={{ 
          margin: "1rem 0",
          padding: "1rem",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px"
        }}>
          <h3>📂 Saved Mixes (Cloud)</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {savedMixes.map((mix, idx) => (
              <li key={idx} style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem",
                marginBottom: "0.5rem"
              }}>
                <button 
                  onClick={() => loadMix(mix)}
                  style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#4CAF50",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  ▶️ {mix.name}
                </button>
                <button 
                  onClick={() => deleteMix(mix.id)}
                  style={{
                    padding: "0.5rem",
                    backgroundColor: "#ff5722",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  ❌
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {loading && <p>Analyzing...</p>}
      
      {chartData && (
        <div style={{ marginTop: "2rem" }}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              plugins: {
                legend: { display: true },
                tooltip: { mode: "index", intersect: false },
                annotation: {
                  annotations: {
                    cursor: {
                      type: "line",
                      xMin: cursorTime,
                      xMax: cursorTime,
                      borderColor: "black",
                      borderWidth: 2,
                      label: {
                        content: "Now",
                        enabled: true,
                        position: "start"
                      }
                    },
                    ...events.reduce((acc, event, idx) => {
                      if (practiceMode && cursorTime < event.time) return acc;

                      let color = "gray";
                      let label = event.type;
                      if (event.type === "bass_cut") {
                        color = "blue";
                        label = "Bass Cut";
                      } else if (event.type === "high_pass_sweep") {
                        color = "orange";
                        label = "High-Pass";
                      } else if (event.type === "low_pass_sweep") {
                        color = "red";
                        label = "Low-Pass";
                      }

                      acc[`event-${idx}`] = {
                        type: "line",
                        xMin: event.time,
                        xMax: event.time,
                        borderColor: color,
                        borderWidth: 2,
                        label: {
                          content: label,
                          enabled: true,
                          position: "start",
                          backgroundColor: color,
                          color: "white"
                        }
                      };
                      return acc;
                    }, {})
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: "Time (s)" },
                },
              },
              elements: {
                point: { radius: 0 },
              },
              animation: false,
            }}
          />
        </div>
      )}

      {practiceMode && events.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <button 
            onClick={() => setCursorTime(Infinity)}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer"
            }}
          >
            👁️ Reveal All Events
          </button>
        </div>
      )}

      {events.length > 0 && (
        <div style={{ marginTop: "1rem" }}>
          <h3>🎧 Detected DJ Actions</h3>
          <ul>
            {events
              .filter(event => !practiceMode || cursorTime >= event.time)
              .map((event, idx) => (
                <li key={idx}>
                  🕒 At {event.time}s — {event.type === "bass_cut"
                    ? "Bass Cut"
                    : event.type === "high_pass_sweep"
                    ? "High-Pass Filter Sweep"
                    : event.type === "low_pass_sweep"
                    ? "Low-Pass Filter Sweep"
                    : event.type}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<MainApp />} />
      </Routes>
    </Router>
  );
}

export default App;