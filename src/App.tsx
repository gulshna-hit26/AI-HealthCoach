
import './App.css'


// MotionStepTracker.tsx
import { useEffect, useRef, useState } from 'react';

 function MotionStepTracker() {
  const [steps, setSteps] = useState(0);
  const [permission, setPermission] = useState<'unknown'|'granted'|'denied'>('unknown');
  const lastPeakTs = useRef(0);
  const lastAcc = useRef<number[]>([]);
  const threshold = 1.2; // tune per device
  const minStepIntervalMs = 300; // reject rapid false peaks

  const requestPermission = async () => {
    try {
      // iOS Safari requires explicit permission
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
      // Prefer accelerationIncludingGravity; subtract gravity if possible
      const ax = e.accelerationIncludingGravity?.x ?? 0;
      const ay = e.accelerationIncludingGravity?.y ?? 0;
      const az = e.accelerationIncludingGravity?.z ?? 0;
      // magnitude
      const mag = Math.sqrt(ax*ax + ay*ay + az*az);

      // simple smoothing
      lastAcc.current.push(mag);
      if (lastAcc.current.length > 5) lastAcc.current.shift();
      const avg = lastAcc.current.reduce((a,b)=>a+b,0) / lastAcc.current.length;

      // peak detection
      const now = Date.now();
      if (avg > threshold && now - lastPeakTs.current > minStepIntervalMs) {
        lastPeakTs.current = now;
        setSteps(s => s + 1);
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [permission]);

  return (
    <div>
      <h3>Steps: {steps}</h3>
      {permission !== 'granted' && (
        <button onClick={requestPermission}>Enable motion tracking</button>
      )}
      <p style={{fontSize:12, color:'#666'}}>
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

export default App
