import React from 'react';

const ProcessingContext = React.createContext({ start: () => {}, end: () => {} });

export function ProcessingProvider({ children }) {
  const [active, setActive] = React.useState(false);
  const [startTime, setStartTime] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);

  React.useEffect(() => {
    let timer;
    if (active) {
      timer = setInterval(() => {
        setElapsed(Date.now() - startTime);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [active, startTime]);

  const start = () => {
    setStartTime(Date.now());
    setElapsed(0);
    setActive(true);
  };

  const end = () => {
    setActive(false);
  };

  return (
    <ProcessingContext.Provider value={{ start, end }}>
      {active && elapsed >= 1000 && (
        <div style={{ position: 'fixed', top: 0, width: '100%', background: '#ffc', textAlign: 'center', padding: '0.5rem', zIndex: 9999 }}>
          {`Procesando... ${Math.floor(elapsed / 1000)}s`}
        </div>
      )}
      {children}
    </ProcessingContext.Provider>
  );
}

export const useProcessing = () => React.useContext(ProcessingContext);
