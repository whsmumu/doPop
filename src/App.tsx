import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, writeFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  author: string;
  reviewer: string;
  version: string;
  createdAt: string;
  lastUpdated: string;
};

function App() {
  const SAVE_PDF = 'C:/Users/ymuri/OneDrive/Área de Trabalho/do-pop';
  const SAVE_JSON = 'C:/Users/ymuri/OneDrive/Área de Trabalho/do-pop/json';

  const [platform, setPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState('welcome');

  // Estados dos dados do POP
  const [selectedSector, setSelectedSector] = useState('');
  const [popTitle, setPopTitle] = useState('');
  const [popDescription, setPopDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ id: Date.now(), description: '', image: null }]);

  // Estados para certificação e timestamps
  const [author, setAuthor] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [version, setVersion] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Estados para a tela de salvamento
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));
  }, []);

  const isWindows = platform === 'windows';
  const appWindow = Window.getCurrent();

  // --- Funções de Navegação ---
  const goToWelcome = () => {
    setCurrentPage('welcome');
    // Reset save status when going to welcome
    setSaveStatus(null);
    setErrorMessage('');
  };

  const goToAbout = () => setCurrentPage('about');
  const goToChoice = () => setCurrentPage('choice');
  const goToEdit = () => setCurrentPage('edit');

  const goToSector = () => {
    if (!createdAt) {
      setCreatedAt(new Date().toISOString());
    }
    setCurrentPage('sector');
  };

  const goToPopDetails = () => setCurrentPage('popDetails');
  const goToSteps = () => setCurrentPage('steps');
  const goBackToAbout = () => setCurrentPage('about');
  const goBackToChoice = () => setCurrentPage('choice');
  const goBackToSector = () => setCurrentPage('sector');
  const goBackToPopDetails = () => setCurrentPage('popDetails');
  const goToCertification = () => setCurrentPage('certification');
  const goBackToSteps = () => setCurrentPage('steps');
  const goToSaving = () => setCurrentPage('saving');

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

  const getFullPopData = (): PopData => ({
    sector: selectedSector,
    title: popTitle,
    description: popDescription,
    steps: steps,
    author: author,
    reviewer: reviewer,
    version: version,
    createdAt: createdAt || new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  });

  const handleSaveJson = async (popData: PopData) => {
    try {
      const fileName = `${popData.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.json`;
      const filePath = `${SAVE_JSON}/${fileName}`;

      // Cria a pasta se ela não existir
      if (!(await exists(SAVE_JSON))) {
        await mkdir(SAVE_JSON, { recursive: true });
      }

      await writeTextFile(filePath, JSON.stringify(popData, null, 2));
      console.log(`JSON salvo em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao salvar o arquivo JSON:", error);
      throw error;
    }
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

        if (data.sector && data.title && data.description && Array.isArray(data.steps)) {
          setSelectedSector(data.sector);
          setPopTitle(data.title);
          setPopDescription(data.description);
          setSteps(data.steps);
          setAuthor(data.author || '');
          setReviewer(data.reviewer || '');
          setVersion(data.version || '');
          setCreatedAt(data.createdAt || new Date().toISOString());

          goToSector();
        } else {
          setErrorMessage("Arquivo JSON inválido ou com formato incorreto.");
          setSaveStatus('error');
        }
      }
    } catch (error) {
      console.error("Erro ao ler ou processar o arquivo JSON:", error);
      setErrorMessage("Não foi possível carregar o arquivo. Verifique se é um JSON válido.");
      setSaveStatus('error');
    }
  };

  const resetAllData = () => {
    setSelectedSector('');
    setPopTitle('');
    setPopDescription('');
    setSteps([{ id: Date.now(), description: '', image: null }]);
    setAuthor('');
    setReviewer('');
    setVersion('');
    setCreatedAt(null);
  };

  const handleGeneratePdf = async (popData: PopData) => {
    try {
      const pdfContent = document.getElementById('pdf-content');
      if (!pdfContent) throw new Error('Elemento PDF não encontrado.');

      pdfContent.innerHTML = '';

      const content = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; background: white; color: black;">
          <!-- Cabeçalho -->
          <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px;">
            <h1 style="color: #333; margin: 0; font-size: 24px; font-weight: bold;">PROCEDIMENTO OPERACIONAL PADRÃO</h1>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Setor: ${popData.sector}</p>
          </div>

          <!-- Informações do POP -->
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 10px;">${popData.title}</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">Descrição:</h3>
              <p style="color: #555; line-height: 1.6; margin: 0; font-size: 14px;">${popData.description}</p>
            </div>
          </div>

          <!-- Passos -->
          <div style="margin-bottom: 40px;">
            <h3 style="color: #333; font-size: 18px; margin-bottom: 20px; border-bottom: 1px solid #ddd; padding-bottom: 10px;">Passo a Passo:</h3>
            ${popData.steps.map((step, index) => `
              <div style="margin-bottom: 25px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa;">
                <div style="display: flex; align-items: flex-start; gap: 15px;">
                  <div style="background: #4966c6; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 14px; flex-shrink: 0;">
                    ${index + 1}
                  </div>
                  <div style="flex: 1;">
                    <p style="color: #333; line-height: 1.6; margin: 0; font-size: 14px;">${step.description}</p>
                    ${step.image ? `<p style="color: #666; font-size: 12px; margin-top: 10px; font-style: italic;">📎 Imagem anexada: ${step.image.split(/[\\/]/).pop()}</p>` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Informações de Certificação -->
          <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #333;">
            <h3 style="color: #333; font-size: 16px; margin-bottom: 15px;">Informações de Certificação:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <strong style="color: #333;">Elaborado por:</strong>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">${popData.author}</p>
              </div>
              <div>
                <strong style="color: #333;">Revisado por:</strong>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">${popData.reviewer}</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
              <div>
                <strong style="color: #333;">Versão:</strong>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">${popData.version}</p>
              </div>
              <div>
                <strong style="color: #333;">Data de Criação:</strong>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">${new Date(popData.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div>
                <strong style="color: #333;">Última Atualização:</strong>
                <p style="margin: 5px 0; color: #555; font-size: 14px;">${new Date(popData.lastUpdated).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          <!-- Rodapé -->
          <div style="margin-top: 40px; text-align: center; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #666; font-size: 12px; margin: 0;">© Novo Mix Supermercados. Todos os direitos reservados.</p>
          </div>
        </div>
      `;

      pdfContent.innerHTML = content;
      pdfContent.style.display = 'block';

      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(pdfContent, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false
      });

      pdfContent.style.display = 'none';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = Math.min(pdfWidth / (canvasWidth * 0.264583), pdfHeight / (canvasHeight * 0.264583));
      const imgWidth = canvasWidth * 0.264583 * ratio;
      const imgHeight = canvasHeight * 0.264583 * ratio;

      const x = (pdfWidth - imgWidth) / 2;
      const y = 10;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', x, y, imgWidth, imgHeight);

      const pdfOutput = pdf.output('arraybuffer');

      const fileName = `${popData.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.pdf`;
      const filePath = `${SAVE_PDF}/${fileName}`;

      if (!(await exists(SAVE_PDF))) {
        await mkdir(SAVE_PDF, { recursive: true });
      }

      await writeFile(filePath, new Uint8Array(pdfOutput));
      console.log(`PDF salvo em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao gerar ou salvar o PDF:", error);
      throw error;
    }
  };

  const handleFinalSubmit = async () => {
    goToSaving();
    setIsLoading(true);
    setSaveStatus('loading');
    setErrorMessage('');

    try {
      const popData = getFullPopData();

      // Simula um pequeno delay para mostrar o loading
      await new Promise(resolve => setTimeout(resolve, 500));

      await handleSaveJson(popData);
      await handleGeneratePdf(popData);

      setSaveStatus('success');
      setIsLoading(false);

      // Auto-reset após 3 segundos
      setTimeout(() => {
        resetAllData();
        goToWelcome();
      }, 3000);

    } catch (error) {
      console.error('Erro ao salvar:', error);
      setErrorMessage(`Erro ao salvar os arquivos: ${error}`);
      setSaveStatus('error');
      setIsLoading(false);
    }
  };

  const handleStepImageChange = async (id: number) => {
    try {
      const picturePath = await pictureDir();
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'Image', extensions: ['png', 'jpeg', 'jpg'] }],
        defaultPath: picturePath,
      });
      if (typeof selectedPath === 'string') {
        setSteps(steps.map(step => (step.id === id ? { ...step, image: selectedPath } : step)));
      }
    } catch (error) {
      console.error("Erro ao abrir o seletor de arquivos:", error);
    }
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
        {/* Página 1: Boas-Vindas */}
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
            <button className="button-iniciar" onClick={goToChoice}>Iniciar</button>
          </div>
        </div>

        {/* Página 3: Escolha de Ação */}
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

        {/* Página 4: Edição de POP */}
        <div className={`page ${currentPage !== 'edit' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Selecione um arquivo para editar:</h1>
            <p>O arquivo deve ser do tipo "json"</p>
            <div className="file-select-container">
              <button className="button-select-file" onClick={handleJsonFileSelect}>
                Clique para selecionar um arquivo
              </button>
            </div>
            {saveStatus === 'error' && (
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'rgba(255, 85, 85, 0.1)', border: '1px solid rgba(255, 85, 85, 0.3)', borderRadius: '8px' }}>
                <p style={{ color: 'rgba(255, 138, 138, 0.9)', margin: '0', fontSize: '14px' }}>{errorMessage}</p>
              </div>
            )}
          </div>
          <div className="button-group">
            <button className="button-voltar-352" onClick={goBackToChoice}>Voltar</button>
          </div>
        </div>

        {/* Página 5: Seleção de Setor */}
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

        {/* Página 6: Detalhes do POP */}
        <div className={`page ${currentPage !== 'popDetails' ? 'hidden' : ''}`}>
          <div className="page-content-full-0">
            <div className="details-header">
              <h1>Defina o título e descrição.</h1>
            </div>
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

        {/* Página 7: Passo a Passo */}
        <div className={`page ${currentPage !== 'steps' ? 'hidden' : ''}`}>
          <div className="page-content-full">
            <div className="steps-header">
              <h1>Passo a passo</h1>
              <button className="button-add-step" onClick={addStep}>
                + Adicionar Passo
              </button>
            </div>
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
            <button className="button-continuar" onClick={goToCertification}>Finalizar</button>
          </div>
        </div>

        {/* Página 8: Autor */}
        <div className={`page ${currentPage !== 'certification' ? 'hidden' : ''}`}>
          <div className="page-content-full-0">
            <div className="details-header">
              <h1>Digite quem fez / revisou o arquivo:</h1>
            </div>
            <div className="details-scroll-container">
              <div className="form-container-vertical">
                <div className="form-group">
                  <label htmlFor="author-name">Nome de quem fez</label>
                  <input
                    id="author-name"
                    type="text"
                    placeholder="Digite o nome do autor"
                    className="input-field"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reviewer-name">Nome de quem revisou</label>
                  <input
                    id="reviewer-name"
                    type="text"
                    placeholder="Digite o nome do revisor"
                    className="input-field"
                    value={reviewer}
                    onChange={(e) => setReviewer(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pop-version">Versão</label>
                  <input
                    id="pop-version"
                    type="text"
                    placeholder="Ex: 1.0.0"
                    className="input-field"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="button-group3">
            <button className="button-voltar" onClick={goBackToSteps}>Voltar</button>
            <button className="button-continuar" onClick={handleFinalSubmit} disabled={!author || !reviewer || !version}>Salvar</button>
          </div>
        </div>

        {/* NOVA Página 9: Tela de Salvamento */}
        <div className={`page ${currentPage !== 'saving' ? 'hidden' : ''}`}>
          <div className="page-content">
            {saveStatus === 'loading' && (
              <>
                <div className="loading-spinner" style={{
                  width: '60px',
                  height: '60px',
                  border: '4px solid rgba(255, 255, 255, 0.1)',
                  borderTop: '4px solid #4966c6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginBottom: '20px'
                }} />
                <h1>Salvando procedimento...</h1>
                <p>Aguarde enquanto geramos o PDF e salvamos os arquivos.</p>
              </>
            )}

            {saveStatus === 'success' && (
              <>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#4CAF50',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '30px'
                }}>
                  ✓
                </div>
                <h1>Procedimento salvo com sucesso!</h1>
                <p>O PDF foi salvo em: {SAVE_PDF}</p>
                <p>O JSON foi salvo em: {SAVE_JSON}</p>
                <p style={{ marginTop: '20px', fontSize: '12px', opacity: '0.7' }}>
                  Retornando ao início em alguns segundos...
                </p>
              </>
            )}

            {saveStatus === 'error' && (
              <>
                <div style={{
                  width: '60px',
                  height: '60px',
                  backgroundColor: '#f44336',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  fontSize: '30px'
                }}>
                  ✕
                </div>
                <h1>Erro ao salvar</h1>
                <div style={{
                  marginTop: '20px',
                  padding: '15px',
                  backgroundColor: 'rgba(255, 85, 85, 0.1)',
                  border: '1px solid rgba(255, 85, 85, 0.3)',
                  borderRadius: '8px',
                  maxWidth: '400px'
                }}>
                  <p style={{ color: 'rgba(255, 138, 138, 0.9)', margin: '0', fontSize: '14px' }}>
                    {errorMessage}
                  </p>
                </div>
                <div style={{ marginTop: '30px' }}>
                  <button className="button-continuar" onClick={goToCertification}>
                    Tentar Novamente
                  </button>
                  <button className="button-voltar" onClick={goToWelcome} style={{ marginLeft: '10px' }}>
                    Voltar ao Início
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Template para o PDF */}
      <div id="pdf-content" style={{
        display: 'none',
        position: 'absolute',
        top: '-9999px',
        left: '-9999px',
        width: '210mm',
        minHeight: '297mm',
        backgroundColor: 'white'
      }}>
        {/* Conteúdo será inserido dinamicamente pelo JavaScript */}
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