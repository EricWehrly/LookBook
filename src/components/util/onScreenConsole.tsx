import React, { useEffect, useState } from 'react';
import './onScreenConsole.css';

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const enabled = isMobile; // Global enabled flag

const OnScreenConsole = () => {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const originalLog = console.log;
    const originalError = console.error;
    console.log = (...args) => {
      originalLog(...args);
      setLogs((prevLogs) => [...prevLogs, ...args.map(arg => String(arg))]);
    };
    console.error = (...args) => {
      originalError(...args);
      setLogs((prevLogs) => [...prevLogs, ...args.map(arg => String(arg))]);
    };

    window.onerror = (message, source, lineno, colno, error) => {
      setLogs((prevLogs) => [...prevLogs, `Error: ${message}, Source: ${source}, Line: ${lineno}, Column: ${colno}, Error object: ${JSON.stringify(error)}`]);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      window.onerror = null;
    };
  }, []);

  if (!enabled) return null;

  return (
    <textarea
      className='debugConsole'
      readOnly
      value={logs.join('\n')}
    />
  );
};

export default OnScreenConsole;
