import React from 'react';

const AppTest = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial' }}>
    <h1>Test - React está funcionando!</h1>
    <p>Si ves esto, React está corriendo correctamente.</p>
    <p>Hora actual: {new Date().toLocaleString()}</p>
  </div>
);

export default AppTest;
