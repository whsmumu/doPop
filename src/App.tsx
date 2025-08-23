import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { homeDir, pictureDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, writeFile, create, exists } from '@tauri-apps/plugin-fs';
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


  const SAVE_PDF = 'C:\Users\ymuri\OneDrive\Área de Trabalho\do-pop';
  const SAVE_JSON = 'C:\Users\ymuri\OneDrive\Área de Trabalho\do-pop\json';

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

  const goToSector = () => {
    // Define a data de criação apenas se estiver criando um novo POP
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
      const filePath = `${SAVE_JSON}\\${fileName}`;

      // Cria a pasta se ela não existir
      if (!(await exists(SAVE_JSON))) {
        await create(SAVE_JSON);
      }
      
      await writeTextFile(filePath, JSON.stringify(popData, null, 2));
      console.log(`JSON salvo em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao salvar o arquivo JSON:", error);
      alert('Ocorreu um erro ao salvar o arquivo JSON.');
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
          // Campos da tela de certificação
          setAuthor(data.author || '');
          setReviewer(data.reviewer || '');
          setVersion(data.version || '');
          // Preserva a data de criação original do arquivo
          setCreatedAt(data.createdAt || new Date().toISOString());

          goToSector();
        } else {
          alert("Arquivo JSON inválido ou com formato incorreto.");
        }
      }
    } catch (error) {
      console.error("Erro ao ler ou processar o arquivo JSON:", error);
      alert("Não foi possível carregar o arquivo. Verifique se é um JSON válido.");
    }
  };

  const sendDataToBackend = async (popData: PopData) => {
    console.log("Enviando para o backend:", JSON.stringify(popData, null, 2));
    try {
      const response = await fetch('https://SUA_URL_DE_BACKEND/api/pops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(popData),
      });

      if (!response.ok) throw new Error(`Erro na rede: ${response.statusText}`);

      const result = await response.json();
      console.log('Resposta do backend:', result);

    } catch (error) {
      console.error("Erro ao enviar para o backend:", error);
      alert('Erro ao salvar os dados no servidor.');
    }
  };

   const handleFinalSubmit = async () => {
    const popData = getFullPopData();

    // Salva ambos os arquivos nos caminhos definidos
    await handleSaveJson(popData);
    await handleGeneratePdf(popData);

    //await sendDataToBackend(popData);

    alert('Procedimento salvo com sucesso na pasta');
    
    // Resetar estado e voltar para o início
    goToWelcome();
  };


   const handleGeneratePdf = async (popData: PopData) => {
    try {
      const input = document.getElementById('pdf-content-wrapper');
      if (!input) throw new Error('Elemento para gerar o PDF não encontrado.');

      input.style.display = 'block';
      const canvas = await html2canvas(input);
      input.style.display = 'none';

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      const pdfOutput = pdf.output('arraybuffer');

      const fileName = `${popData.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.pdf`;
      const filePath = `${SAVE_PDF}\\${fileName}`;

      // Cria a pasta se ela não existir
      if (!(await exists(SAVE_PDF))) {
        await create(SAVE_PDF);
      }

      await writeFile(filePath, new Uint8Array(pdfOutput));
      console.log(`PDF salvo em: ${filePath}`);
    } catch (error) {
      console.error("Erro ao gerar ou salvar o PDF:", error);
      alert('Ocorreu um erro ao gerar o PDF.');
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
            {/* Agora chama a nova tela de certificação */}
            <button className="button-continuar" onClick={goToCertification}>Finalizar</button>
          </div>
        </div>
      </div>



      {/* --- NOVA PÁGINA 6: Certificação --- */}
      <div className={`page ${currentPage !== 'certification' ? 'hidden' : ''}`}>
        <div className="page-content-full-0">
          <div className="details-header">
            <h1>Certificação</h1>
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

      {/* Template invisível para o PDF */}
      <div id="pdf-content" style={{ display: 'none', padding: '20px' }}>
        {/* Conteúdo que será renderizado no PDF */}
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