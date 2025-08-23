import { useEffect, useState } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';

function App() {
  const [platform, setPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState('welcome');
  const [selectedSector, setSelectedSector] = useState('');

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));
  }, []);

  const isWindows = platform === 'windows';
  const appWindow = Window.getCurrent();

  // Funções de navegação
  const goToAbout = () => setCurrentPage('about');
  const goToSector = () => setCurrentPage('sector');
  const goBackToWelcome = () => setCurrentPage('welcome');
  const goBackToAbout = () => setCurrentPage('about');

  // Atualiza o estado quando um setor é selecionado
  const handleSectorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedSector(event.target.value);
  };

  // Lista de setores (pode ser expandida)
  const setores = ["Administrativo", "Comercial", "Fiscal", "Financeiro", "TI", "RH", "Logística", "Controles Internos", "Manutenção"];

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {isWindows ? (
        // @ts-ignore
        <div className="titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: '32px', '-webkit-app-region': 'drag' }}>
          <div className="window-title">do-pop</div>
          {/* @ts-ignore */}
          <div style={{ display: 'flex', gap: '1px', '-webkit-app-region': 'no-drag' }}>
            <button onClick={() => appWindow.minimize()} style={{ minWidth: '28px' }}><span>–</span></button>
            <button onClick={() => appWindow.toggleMaximize()} style={{ minWidth: '28px' }}>+</button>
            <button onClick={() => appWindow.close()} style={{ minWidth: '28px' }}>×</button>
          </div>
        </div>
      ) : (
        <div className="titlebar" data-tauri-drag-region>
          <div className="window-title">do-pop</div>
        </div>
      )}



      <div className="window-content">
        {/* Página 1: Tela de Boas-Vindas */}
        <div className={`page ${currentPage !== 'welcome' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Bem-vindo(a) ao <strong>do-pop!</strong></h1>
            <p>Gerador de Processos Operacionais Padrão</p>
          </div>
          <button className="button-avancar" onClick={goToAbout}>Avançar</button>
        </div>



        {/* Página 2: Tela de Explicação */}
        <div className={`page ${currentPage !== 'about' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Como funciona?</h1>
            <p style={{ maxWidth: '70%', textAlign: 'center' }}>
              Este aplicativo vai te ajudar a <strong><strong>documentar</strong></strong>, <strong><strong>gerenciar</strong></strong> e <strong><strong>padronizar</strong></strong> todos os procedimentos operacionais padrão do seu setor, através de passos detalhados e com imagens para melhor entendimento.
            </p>
          </div>
          <div className="button-group">
            <button className="button-voltar" onClick={goBackToWelcome}>Voltar</button>
            <button className="button-iniciar" onClick={goToSector}>Iniciar</button>
          </div>
        </div>



        {/* Página 3: Seleção de Setor */}
        <div className={`page ${currentPage !== 'sector' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Qual o seu setor?</h1>
            <div className="checklist-container">
              {setores
                .filter(setor => typeof setor === "string" && setor.trim() !== "")
                .map((setor, idx) => (
                  <label key={idx} className="radio-option">
                    <input
                      type="radio"
                      name="setor"
                      value={setor}
                      checked={selectedSector === setor}
                      onChange={handleSectorChange}
                    />
                    <span className="radio-label">{setor}</span>
                  </label>
                ))}
            </div>
          </div>
          <div className="button-group2">
            <button className="button-voltar" onClick={goBackToAbout}>Voltar</button>
            {/* O botão de Enviar agora está aqui, ao lado do de Voltar */}
            <button className="button-continuar" onClick={() => { /* Adicionar lógica de envio aqui */ }}>Continuar</button>
          </div>
        </div>
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