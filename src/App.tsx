// App.tsx
import './App.css'
import { useEffect, useRef, useState } from 'react';

function MotionStepTracker() {
  const [steps, setSteps] = useState(0);
  const [permission, setPermission] = useState<'unknown'|'granted'|'denied'>('unknown');
  const lastPeakTs = useRef(0);
  const lastAcc = useRef<number[]>([]);
  const threshold = 8; // tuned for walking peaks
  const minStepIntervalMs = 300; // reject rapid false peaks
  const [aboveThreshold, setAboveThreshold] = useState(false);

  const requestPermission = async () => {
    try {
      const anyWindow = window as any;
      if (typeof anyWindow.DeviceMotionEvent?.requestPermission === 'function') {
        const res = await anyWindow.DeviceMotionEvent.requestPermission();
        setPermission(res === 'granted' ? 'granted' : 'denied');
      } else {
        setPermission('granted'); // Android/desktop usually don’t require
      }
    } catch {
      setPermission('denied');
    }
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const handler = (e: DeviceMotionEvent) => {
      // Prefer acceleration without gravity if available
      const ax = e.acceleration?.x ?? e.accelerationIncludingGravity?.x ?? 0;
      const ay = e.acceleration?.y ?? e.accelerationIncludingGravity?.y ?? 0;
      const az = e.acceleration?.z ?? e.accelerationIncludingGravity?.z ?? 0;

      // magnitude
      const mag = Math.sqrt(ax*ax + ay*ay + az*az);

      // smoothing (average of last 20 samples)
      lastAcc.current.push(mag);
      if (lastAcc.current.length > 20) lastAcc.current.shift();
      const avg = lastAcc.current.reduce((a,b)=>a+b,0) / lastAcc.current.length;

      const now = Date.now();

      // peak detection with valley check
      if (avg > threshold && !aboveThreshold && now - lastPeakTs.current > minStepIntervalMs) {
        setAboveThreshold(true);
        lastPeakTs.current = now;
        setSteps(s => s + 1);
      } else if (avg < threshold * 0.5) {
        // reset once we drop below half threshold
        setAboveThreshold(false);
      }
    };

    window.addEventListener('devicemotion', handler, { capture: true });
    return () => window.removeEventListener('devicemotion', handler, { capture: true });
  }, [permission, aboveThreshold]);

  const resetSteps = () => setSteps(0);

  return (
    <div className="p-4">
      <h3 className="text-xl font-bold">Steps: {steps}</h3>
      {permission !== 'granted' && (
        <button 
          onClick={requestPermission}
          className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
        >
          Enable Motion Tracking
        </button>
      )}
      <button 
        onClick={resetSteps}
        className="bg-red-500 text-white px-4 py-2 rounded mt-2 ml-2"
      >
        Reset
      </button>
      <p className="text-sm text-gray-600 mt-2">
        Move with the phone in your pocket/hand. Accuracy varies by device.
      </p>
    </div>
  );
}

function App() {
  return (
    <>
      <MotionStepTracker/>
      <h1 className='bg-blue-200'>hello</h1>
    </>
  )
}

export default App;
