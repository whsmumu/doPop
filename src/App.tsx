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
  const cmdSymbol = platform === 'macos' ? '⌘' : 'Ctrl';
  const toggleShortcut = platform === 'macos' ? '⇧⌘T' : '⇧Ctrl+T';

  const appWindow = Window.getCurrent();

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {isWindows ? (
        // @ts-ignore
        <div className="titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: '32px', '-webkit-app-region': 'drag' }}>
          <div className="window-title">bewindow</div>
          {/* @ts-ignore */}
          <div style={{ display: 'flex', gap: '4px', '-webkit-app-region': 'no-drag' }}>
            <button onClick={() => appWindow.minimize()} style={{ minWidth: '32px' }}>_</button>
            <button onClick={() => appWindow.toggleMaximize()} style={{ minWidth: '32px' }}>□</button>
            <button onClick={() => appWindow.close()} style={{ minWidth: '32px' }}>X</button>
          </div>
        </div>
      ) : (
        <div className="titlebar" data-tauri-drag-region>
          <div className="window-title">bewindow</div>
        </div>
      )}

      <div className="window-content">
        <h1>Hello World</h1>
        <p>Native Interface</p>
      </div>

      <footer className="macos-footer">
        <div className="footer-left">
          made by bero ☕️
        </div>
        <div className="footer-right">
          {toggleShortcut} Toggle window
        </div>
      </footer>
    </div>
  );
}

export default App;
