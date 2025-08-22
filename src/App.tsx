import { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';

function App() {
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));
  }, []);

  const isWindows = platform === 'windows';

  const appWindow = Window.getCurrent();

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {isWindows ? (
        // @ts-ignore
        <div className="titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: '32px', '-webkit-app-region': 'drag' }}>
          <div className="window-title">doPOP</div>
          {/* @ts-ignore */}
          <div style={{ display: 'flex', gap: '1px', '-webkit-app-region': 'no-drag' }}>
            <button onClick={() => appWindow.minimize()} style={{ minWidth: '28px' }}><span>–</span></button>
            <button onClick={() => appWindow.toggleMaximize()} style={{ minWidth: '28px' }}>+</button>
            <button onClick={() => appWindow.close()} style={{ minWidth: '28px' }}>×</button>
          </div>
        </div>
      ) : (
        <div className="titlebar" data-tauri-drag-region>
          <div className="window-title">doPOP</div>
        </div>
      )}

      <div className="window-content">
        <h1>Bem-vindo(a)!</h1>
        <p>Gerador de Processos Operacionais Padrão</p>
      </div>

      <footer className="macos-footer">
        <div className="footer-middle">
          © Novo Mix Supermercados. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;
