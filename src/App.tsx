import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { readTextFile } from '@tauri-apps/plugin-fs';

// Definição do tipo para um passo do POP
type Step = {
  id: number;
  description: string;
  image: string | null;
};

type PopData = {
  sector: string;
  title: string;
  description: string;
  steps: Step[];
};


function App() {
  const [platform, setPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState('welcome');

  // Estados para armazenar todos os dados do POP
  const [selectedSector, setSelectedSector] = useState('');
  const [popTitle, setPopTitle] = useState('');
  const [popDescription, setPopDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([
    { id: Date.now(), description: '', image: null }
  ]);

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));
  }, []);

  const isWindows = platform === 'windows';
  const appWindow = Window.getCurrent();

  // --- Funções de Navegação ---
  const goToWelcome = () => setCurrentPage('welcome');
  const goToAbout = () => setCurrentPage('about');
  const goToChoice = () => setCurrentPage('choice'); // NOVO
  const goToEdit = () => setCurrentPage('edit');
  const goToSector = () => setCurrentPage('sector');
  const goToPopDetails = () => setCurrentPage('popDetails');
  const goToSteps = () => setCurrentPage('steps');
  const goBackToAbout = () => setCurrentPage('about');
  const goBackToChoice = () => setCurrentPage('choice');
  const goBackToSector = () => setCurrentPage('sector');
  const goBackToPopDetails = () => setCurrentPage('popDetails');

  // --- Manipuladores de Dados ---
  const handleSectorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedSector(event.target.value);
  };

  // --- Funções para Gerenciar Passos ---
  const addStep = () => {
    const newStep = { id: Date.now(), description: '', image: null };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const handleStepDescriptionChange = (id: number, description: string) => {
    setSteps(steps.map(step =>
      step.id === id ? { ...step, description } : step
    ));
  };

  const handleJsonFileSelect = async () => {
    try {
      const homePath = await homeDir();
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: homePath,
      });

      if (typeof selectedPath === 'string') {
        const fileContents = await readTextFile(selectedPath);
        const data: PopData = JSON.parse(fileContents);

        // Validação básica dos dados carregados
        if (data.sector && data.title && data.description && Array.isArray(data.steps)) {
          // Preenche todos os estados da aplicação com os dados do arquivo
          setSelectedSector(data.sector);
          setPopTitle(data.title);
          setPopDescription(data.description);
          setSteps(data.steps);

          // Navega para a primeira tela do fluxo para começar a edição
          goToSector();
        } else {
          // A função `alert` virá do plugin de diálogo, que já está configurado
          alert("Arquivo JSON inválido ou com formato incorreto.");
        }
      }
    } catch (error) {
      console.error("Erro ao ler ou processar o arquivo JSON:", error);
      alert("Não foi possível carregar o arquivo. Verifique se é um JSON válido.");
    }
  };

  const handleStepImageChange = async (id: number) => {
    try {
      // 1. Pega o caminho para a pasta de imagens do sistema
      const picturePath = await pictureDir();

      // 2. Abre a janela de seleção de arquivo
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'Image', extensions: ['png', 'jpeg', 'jpg'] }],
        // 3. Define o caminho inicial para a pasta de imagens
        defaultPath: picturePath,
      });

      // 4. Atualiza o estado com a imagem selecionada
      if (typeof selectedPath === 'string') {
        setSteps(steps.map(step =>
          step.id === id ? { ...step, image: selectedPath } : step
        ));
      }
    } catch (error) {
      console.error("Erro ao abrir o seletor de arquivos:", error);
    }
  };

  // Função para enviar todos os dados para o backend (simulação)
  const handleSubmitPop = () => {
    const popData = {
      sector: selectedSector,
      title: popTitle,
      description: popDescription,
      steps: steps
    };
    console.log("Enviando para o backend:", popData);
    // invoke('sua_funcao_backend', { data: popData });
  };


  const setores = ["Administrativo", "Comercial", "Fiscal", "Financeiro", "TI", "RH", "Logística", "Controles Internos", "Manutenção"];

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {isWindows ? (
        <div className="titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: '32px', '-webkit-app-region': 'drag' } as any}>
          <div className="window-title">do-pop</div>
          <div style={{ display: 'flex', gap: '1px', '-webkit-app-region': 'no-drag' } as any}>
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
        {/* Página 1: Boas-Vindas (Inalterada) */}
        <div className={`page ${currentPage !== 'welcome' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Bem-vindo(a) ao <strong>do-pop!</strong></h1>
            <p>Gerador de Processos Operacionais Padrão</p>
          </div>
          <button className="button-avancar" onClick={goToAbout}>Avançar</button>
        </div>

        {/* Página 2: Explicação */}
        <div className={`page ${currentPage !== 'about' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Como funciona?</h1>
            <p style={{ maxWidth: '70%', textAlign: 'center' }}>
              Este aplicativo vai te ajudar a <strong>documentar</strong>, <strong>gerenciar</strong> e <strong>padronizar</strong> todos os procedimentos operacionais padrão do seu setor, através de passos detalhados e com imagens para melhor entendimento.
            </p>
          </div>
          <div className="button-group">
            <button className="button-voltar" onClick={goToWelcome}>Voltar</button>
            {/* CORREÇÃO: Mudar para goToChoice */}
            <button className="button-iniciar" onClick={goToChoice}>Iniciar</button>
          </div>
        </div>


        {/* --- NOVA PÁGINA 3.5: Escolha de Ação --- */}
        <div className={`page ${currentPage !== 'choice' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Escolha uma opção:</h1>
            <p>Crie um novo procedimento operacional padrão <p>ou então edite um procedimento já existente.</p></p>
          </div>
          <div className="button-group">
            <button className="button-voltar" onClick={goBackToAbout}>Voltar</button>
            <button className="button-iniciar" onClick={goToSector}>Criar</button>
            <button className="button-iniciar" onClick={goToEdit}>Editar</button>
            
          </div>
        </div>

        {/* --- NOVA PÁGINA 3.5.2: Edição de POP --- */}
        <div className={`page ${currentPage !== 'edit' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Selecione um arquivo para editar:</h1>
            <p>O arquivo deve ser do tipo "json"</p>
            {/* Estilo adicionado no App.css */}
            <div className="file-select-container">
              <button className="button-select-file" onClick={handleJsonFileSelect}>
                Clique para selecionar um arquivo
              </button>
            </div>
          </div>
          <div className="button-group">
            <button className="button-voltar-352" onClick={goBackToChoice}>Voltar</button>
          </div>
        </div>

        {/* Página 3: Seleção de Setor (Inalterada) */}
        <div className={`page ${currentPage !== 'sector' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Qual o seu setor?</h1>
            <div className="checklist-container">
              {setores.map((setor, idx) => (
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
            <button className="button-voltar" onClick={goBackToChoice}>Voltar</button>
            <button className="button-continuar" onClick={goToPopDetails} disabled={!selectedSector}>Continuar</button>
          </div>
        </div>

        {/* Página 4: Detalhes do POP (Layout com Rolagem) */}
        <div className={`page ${currentPage !== 'popDetails' ? 'hidden' : ''}`}>
          <div className="page-content-full-0">
            {/* Cabeçalho fixo da página de detalhes */}
            <div className="details-header">
              <h1>Defina o título e descrição.</h1>
            </div>

            {/* Container que terá o rolamento */}
            <div className="details-scroll-container">
              <div className="form-container-vertical">
                <div className="form-group">
                  <label htmlFor="pop-title">Digite o título</label>
                  <input
                    id="pop-title"
                    type="text"
                    placeholder="Ex: Como emitir uma nota fiscal"
                    className="input-field"
                    value={popTitle}
                    onChange={(e) => setPopTitle(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pop-description">Digite a descrição</label>
                  <textarea
                    id="pop-description"
                    placeholder="Objetivo deste procedimento..."
                    className="textarea-field"
                    value={popDescription}
                    onChange={(e) => setPopDescription(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-group3">
            <button className="button-voltar" onClick={goBackToSector}>Voltar</button>
            <button className="button-continuar" onClick={goToSteps} disabled={!popTitle || !popDescription}>Continuar</button>
          </div>
        </div>



        {/* Página 5: Passo a Passo (Layout Reformulado) */}
        <div className={`page ${currentPage !== 'steps' ? 'hidden' : ''}`}>
          {/* O page-content agora ocupa toda a altura */}
          <div className="page-content-full">
            {/* Cabeçalho fixo */}
            <div className="steps-header">
              <h1>Passo a passo</h1>
              <button className="button-add-step" onClick={addStep}>
                + Adicionar Passo
              </button>
            </div>

            {/* Container com a lista de passos que terá o rolamento */}
            <div className="steps-list-container">
              {steps.map((step, index) => (
                <div key={step.id} className="step-item">
                  <span className="step-number">{index + 1}</span>
                  <div className="step-content">
                    <textarea
                      placeholder="Descreva o passo aqui..."
                      className="step-textarea"
                      value={step.description}
                      onChange={(e) => handleStepDescriptionChange(step.id, e.target.value)}
                    />
                    <div className="step-actions">
                      <button className="button-image" onClick={() => handleStepImageChange(step.id)}>
                        {step.image ? 'Trocar Imagem' : 'Anexar Imagem'}
                      </button>
                      {step.image && <span className="image-name" title={step.image}>{step.image.split(/[\\/]/).pop()}</span>}
                      {/* Div para empurrar o botão remover para a direita */}
                      <div className="spacer"></div>
                      {steps.length > 1 && (
                        <button className="button-remove" onClick={() => removeStep(step.id)}>Remover</button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="button-group4">
            <button className="button-voltar" onClick={goBackToPopDetails}>Voltar</button>
            <button className="button-continuar" onClick={handleSubmitPop}>Finalizar</button>
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