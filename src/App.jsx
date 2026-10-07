import { useEffect, useRef, useState } from "react";

export default function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [userId, setUserId] = useState("1");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let stream;
    let cancelled = false;
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        videoRef.current.srcObject = s;
      })
      .catch(() => {
        setIsError(true);
        setMessage("Camera ki permission nahi mili. Browser mein camera allow karo.");
      });
    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const enroll = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    setLoading(true);
    setMessage("");

    canvas.toBlob(
      async (blob) => {
        const form = new FormData();
        form.append("userId", userId);
        form.append("image", blob, "selfie.jpg");
        try {
          const res = await fetch("http://localhost:8080/api/face/enroll", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          setIsError(!res.ok);
          setMessage(res.ok ? "Success: " + data.message : "Error: " + data.error);
        } catch {
          setIsError(true);
          setMessage("Backend se connect nahi hua. Spring Boot app chal rahi hai?");
        }
        setLoading(false);
      },
      "image/jpeg",
      0.9
    );
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto", textAlign: "center", fontFamily: "sans-serif" }}>
      <h2>Face Enroll</h2>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: "100%", borderRadius: 12, background: "#000", transform: "scaleX(-1)" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div style={{ margin: "16px 0" }}>
        <label>User ID: </label>
        <input
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          style={{ width: 80, padding: 6 }}
        />
      </div>

      <button onClick={enroll} disabled={loading} style={{ padding: "10px 24px", fontSize: 16 }}>
        {loading ? "Bhej rahe hain..." : "Capture & Enroll"}
      </button>

      {message && (
        <p style={{ marginTop: 16, color: isError ? "crimson" : "seagreen" }}>{message}</p>
      )}
    </div>
  );
}