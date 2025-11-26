// App.tsx
import './App.css'
import { useEffect, useRef, useState } from 'react';

function MotionStepTracker() {
  const [steps, setSteps] = useState(0);
  const [permission, setPermission] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const lastPeakTs = useRef(0);
  const lastAcc = useRef<number[]>([]);
  const gravityRef = useRef(0);

  const threshold = 2.5;
  const minStepIntervalMs = 300;
  const [aboveThreshold, setAboveThreshold] = useState(false);

  const requestPermission = async () => {
    try {
      const anyWindow = window as any;
      if (typeof anyWindow.DeviceMotionEvent?.requestPermission === 'function') {
        const res = await anyWindow.DeviceMotionEvent.requestPermission();
        setPermission(res === 'granted' ? 'granted' : 'denied');
      } else {
        setPermission('granted');
      }
    } catch {
      setPermission('denied');
    }
  };

  useEffect(() => {
    if (permission !== 'granted') return;

    const handler = (e: DeviceMotionEvent) => {
      let ax = e.acceleration?.x ?? null;
      let ay = e.acceleration?.y ?? null;
      let az = e.acceleration?.z ?? null;

      if (ax === null || ay === null || az === null) {
        ax = e.accelerationIncludingGravity?.x ?? 0;
        ay = e.accelerationIncludingGravity?.y ?? 0;
        az = e.accelerationIncludingGravity?.z ?? 0;
      }

      const mag = Math.sqrt(ax * ax + ay * ay + az * az);

      lastAcc.current.push(mag);
      if (lastAcc.current.length > 10) lastAcc.current.shift();
      const avg = lastAcc.current.reduce((a, b) => a + b, 0) / lastAcc.current.length;

      if (gravityRef.current === 0) gravityRef.current = avg;
      gravityRef.current = 0.98 * gravityRef.current + 0.02 * avg;

      const userAcc = Math.abs(avg - gravityRef.current);
      const now = Date.now();

      if (userAcc > threshold && !aboveThreshold && now - lastPeakTs.current > minStepIntervalMs) {
        setAboveThreshold(true);
        lastPeakTs.current = now;
        setSteps(s => s + 1);
      } else if (userAcc < threshold * 0.5) {
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
        Move with the phone in your pocket/hand.
      </p>
    </div>
  );
}

function App() {
  return (
    <>
      <MotionStepTracker />
      <h1 className='bg-blue-200'>hello</h1>
    </>
  )
}

export default App;
