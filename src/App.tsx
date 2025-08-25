import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { pictureDir } from '@tauri-apps/api/path';
import React from 'react';

// Tipos
type PopCategory = 
  | "Sistêmico" 
  | "Processual" 
  | "Cadastro" 
  | "Alteração" 
  | "Consulta"
  | "Relatório";

type Step = {
  id: number;
  description: string;
  image: string | null;
};

type PopData = {
  id?: number;
  sector: string;
  category: PopCategory;
  title: string;
  description: string;
  steps: Step[];
  author: string;
  reviewer: string;
  version: string;
  createdAt: string;
  lastUpdated: string;
  isActive: boolean;
};

type AdminSettings = {
  companyName: string;
  sectorPasswords: { [sector: string]: string };
  adminPassword: string;
  categoriesBySector: { [sector: string]: PopCategory[] };
};

function App() {
  const [platform, setPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState('welcome');

  // Estados dos dados do POP
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PopCategory | ''>('');
  const [popTitle, setPopTitle] = useState('');
  const [popDescription, setPopDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ id: Date.now(), description: '', image: null }]);
  const [editingPopId, setEditingPopId] = useState<number | null>(null);

  // Estados para certificação
  const [author, setAuthor] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [version, setVersion] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  // Estados para dropdown de categoria
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [currentAuthSector, setCurrentAuthSector] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [popsInSector, setPopsInSector] = useState<PopData[]>([]);
  const [isLoadingPops, setIsLoadingPops] = useState(false);

  // Estados para configurações de admin
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  // Estados para salvar
  const [saveStatus, setSaveStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  // Configurações locais (temporárias até backend estar pronto)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    companyName: "Novo Mix Supermercados",
    sectorPasswords: {
      "Administrativo": "admin123",
      "Comercial": "admin123",
      "Fiscal": "admin123",
      "Financeiro": "admin123",
      "TI": "admin123",
      "RH": "admin123",
      "Logística": "admin123",
      "Controles Internos": "admin123",
      "Manutenção": "admin123"
    },
    adminPassword: "master123",
    categoriesBySector: {
      "Administrativo": ["Cadastro", "Alteração", "Consulta", "Processual"],
      "Comercial": ["Sistêmico", "Processual", "Consulta", "Relatório"],
      "Fiscal": ["Cadastro", "Alteração", "Relatório", "Processual"],
      "Financeiro": ["Processual", "Relatório", "Consulta", "Sistêmico"],
      "TI": ["Sistêmico", "Processual", "Alteração", "Cadastro"],
      "RH": ["Cadastro", "Processual", "Consulta", "Alteração"],
      "Logística": ["Processual", "Sistêmico", "Consulta", "Relatório"],
      "Controles Internos": ["Processual", "Relatório", "Consulta", "Sistêmico"],
      "Manutenção": ["Processual", "Sistêmico", "Alteração", "Cadastro"]
    }
  });

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));

    // Fechar dropdown quando clica fora
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        setIsCategoryDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isWindows = platform === 'windows';
  const appWindow = Window.getCurrent();

  const setores = ["Administrativo", "Comercial", "Fiscal", "Financeiro", "TI", "RH", "Logística", "Controles Internos", "Manutenção"];

  // --- API Functions (Mock - substituir por chamadas reais) ---
  const apiService = {
    async createPop(popData: PopData): Promise<{success: boolean, data?: PopData, error?: string}> {
      // Mock - substituir por fetch real
      console.log('Creating POP:', popData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, data: { ...popData, id: Date.now() } };
    },

    async updatePop(id: number, popData: PopData): Promise<{success: boolean, data?: PopData, error?: string}> {
      console.log('Updating POP:', id, popData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { success: true, data: { ...popData, id } };
    },

    async deletePop(id: number): Promise<{success: boolean, error?: string}> {
      console.log('Deleting POP:', id);
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    },

    async getPopsBySector(sector: string): Promise<{success: boolean, data?: PopData[], error?: string}> {
      console.log('Getting POPs for sector:', sector);
      await new Promise(resolve => setTimeout(resolve, 500));
      // Mock data
      const mockPops: PopData[] = [
        {
          id: 1,
          sector,
          category: "Processual",
          title: "Como fazer backup do sistema",
          description: "Procedimento para realizar backup diário",
          steps: [{ id: 1, description: "Acessar o sistema", image: null }],
          author: "João Silva",
          reviewer: "Maria Santos",
          version: "1.0.0",
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          isActive: true
        }
      ];
      return { success: true, data: mockPops };
    },

    async validateSectorPassword(sector: string, password: string): Promise<{success: boolean, error?: string}> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const isValid = adminSettings.sectorPasswords[sector] === password;
      return { success: isValid, error: isValid ? undefined : "Senha incorreta" };
    },

    async validateAdminPassword(password: string): Promise<{success: boolean, error?: string}> {
      await new Promise(resolve => setTimeout(resolve, 300));
      const isValid = adminSettings.adminPassword === password;
      return { success: isValid, error: isValid ? undefined : "Senha de administrador incorreta" };
    }
  };

  // --- Navigation Functions ---
  const goToWelcome = () => {
    setCurrentPage('welcome');
    resetAllStates();
  };

  const goToAbout = () => setCurrentPage('about');
  const goToChoice = () => setCurrentPage('choice');
  const goToSectorSelection = () => setCurrentPage('sectorSelection');
  const goToSectorAuth = (sector: string) => {
    setCurrentAuthSector(sector);
    setCurrentPage('sectorAuth');
  };
  const goToPopManagement = () => setCurrentPage('popManagement');

  const goToSector = () => {
    if (!createdAt) {
      setCreatedAt(new Date().toISOString());
    }
    setCurrentPage('sector');
  };

  const goToPopDetails = () => setCurrentPage('popDetails');
  const goToSteps = () => setCurrentPage('steps');
  const goToCertification = () => setCurrentPage('certification');

  const goToAdminConfig = () => setCurrentPage('adminConfig');
  const goToAdminAuth = () => setCurrentPage('adminAuth');

  // Reset functions
  const resetAllStates = () => {
    setSelectedSector('');
    setSelectedCategory('');
    setPopTitle('');
    setPopDescription('');
    setSteps([{ id: Date.now(), description: '', image: null }]);
    setAuthor('');
    setReviewer('');
    setVersion('');
    setCreatedAt(null);
    setEditingPopId(null);
    setIsAuthenticated(false);
    setCurrentAuthSector('');
    setPasswordInput('');
    setAuthError('');
    setPopsInSector([]);
    setSaveStatus(null);
    setSaveMessage('');
    setIsAdminMode(false);
    setAdminPasswordInput('');
    setAdminError('');
    setIsCategoryDropdownOpen(false);
  };

  // --- Authentication Functions ---
  const handleSectorAuth = async () => {
    try {
      const result = await apiService.validateSectorPassword(currentAuthSector, passwordInput);
      if (result.success) {
        setIsAuthenticated(true);
        setAuthError('');
        setPasswordInput('');
        loadPopsForSector(currentAuthSector);
      } else {
        setAuthError(result.error || 'Senha incorreta');
      }
    } catch (error) {
      setAuthError('Erro de conexão');
    }
  };

  const handleAdminAuth = async () => {
    try {
      const result = await apiService.validateAdminPassword(adminPasswordInput);
      if (result.success) {
        setIsAdminMode(true);
        setAdminError('');
        setAdminPasswordInput('');
        goToAdminConfig();
      } else {
        setAdminError(result.error || 'Senha incorreta');
      }
    } catch (error) {
      setAdminError('Erro de conexão');
    }
  };

  // --- POP Management Functions ---
  const loadPopsForSector = async (sector: string) => {
    setIsLoadingPops(true);
    try {
      const result = await apiService.getPopsBySector(sector);
      if (result.success && result.data) {
        setPopsInSector(result.data);
      }
    } catch (error) {
      console.error('Error loading POPs:', error);
    } finally {
      setIsLoadingPops(false);
      goToPopManagement();
    }
  };

  const handleEditPop = (pop: PopData) => {
    setEditingPopId(pop.id || null);
    setSelectedSector(pop.sector);
    setSelectedCategory(pop.category);
    setPopTitle(pop.title);
    setPopDescription(pop.description);
    setSteps(pop.steps);
    setAuthor(pop.author);
    setReviewer(pop.reviewer);
    setVersion(pop.version);
    setCreatedAt(pop.createdAt);
    goToSector();
  };

  const handleDeletePop = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este POP?')) {
      try {
        const result = await apiService.deletePop(id);
        if (result.success) {
          setPopsInSector(pops => pops.filter(pop => pop.id !== id));
        }
      } catch (error) {
        console.error('Error deleting POP:', error);
      }
    }
  };

  // --- Form Handlers ---
  const handleSectorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedSector(event.target.value);
    // Reset da categoria quando muda de setor
    setSelectedCategory('');
    setIsCategoryDropdownOpen(false);
  };

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

  // --- Save Function ---
  const handleFinalSubmit = async () => {
    // Primeiro navegar para a página de salvamento
    setCurrentPage('saving');
    setSaveStatus('loading');
    setSaveMessage('Salvando procedimento...');

    try {
      const popData: PopData = {
        sector: selectedSector,
        category: selectedCategory as PopCategory,
        title: popTitle,
        description: popDescription,
        steps: steps,
        author: author,
        reviewer: reviewer,
        version: version,
        createdAt: createdAt || new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        isActive: true
      };

      let result;
      if (editingPopId) {
        result = await apiService.updatePop(editingPopId, popData);
        setSaveMessage('Procedimento atualizado com sucesso!');
      } else {
        result = await apiService.createPop(popData);
        setSaveMessage('Procedimento criado com sucesso!');
      }

      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => {
          resetAllStates();
          goToWelcome();
        }, 3000);
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(`Erro ao salvar: ${error}`);
    }
  };

  // Admin Settings Functions
  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    // Aqui você faria a chamada para a API
    console.log('Updating admin settings:', newSettings);
  };

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {/* Title Bar */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="window-title">do-pop</div>
            <button 
              className="admin-gear-btn"
              onClick={goToAdminAuth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '2px',
                borderRadius: '3px',
                transition: 'all 0.2s ease',
                '-webkit-app-region': 'no-drag'
              } as any}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              ⚙️
            </button>
          </div>
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
            <p>Crie um novo procedimento operacional padrão <p>ou gerencie os procedimentos existentes.</p></p>
          </div>
          <div className="button-group">
            <button className="button-voltar" onClick={goToAbout}>Voltar</button>
            <button className="button-iniciar" onClick={goToSector}>Criar</button>
            <button className="button-iniciar" onClick={goToSectorSelection}>Gerenciar</button>
          </div>
        </div>

        {/* Página 4: Seleção de Setor para Gerenciamento */}
        <div className={`page ${currentPage !== 'sectorSelection' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Selecione o setor:</h1>
            <div className="checklist-container">
              {setores.map((setor, idx) => (
                <div key={idx} className="radio-option" onClick={() => goToSectorAuth(setor)}>
                  <span className="radio-label">{setor}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="button-group2">
            <button className="button-voltar" onClick={goToChoice}>Voltar</button>
          </div>
        </div>

        {/* Página 5: Autenticação do Setor */}
        <div className={`page ${currentPage !== 'sectorAuth' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Acesso ao setor: {currentAuthSector}</h1>
            <p>Digite a senha para acessar os POPs deste setor:</p>
            <div className="form-container-vertical" style={{ maxWidth: '300px' }}>
              <input
                type="password"
                placeholder="Digite a senha"
                className="input-field"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSectorAuth()}
              />
              {authError && (
                <p style={{ color: 'rgba(255, 85, 85, 0.9)', fontSize: '14px', margin: '10px 0 0 0' }}>
                  {authError}
                </p>
              )}
            </div>
          </div>
          <div className="button-group2">
            <button className="button-voltar" onClick={goToSectorSelection}>Voltar</button>
            <button className="button-continuar" onClick={handleSectorAuth} disabled={!passwordInput}>
              Acessar
            </button>
          </div>
        </div>

        {/* Página 6: Gerenciamento de POPs */}
        <div className={`page ${currentPage !== 'popManagement' ? 'hidden' : ''}`}>
          <div className="page-content-full">
            <div className="steps-header">
              <h1>POPs do setor: {currentAuthSector}</h1>
              <button className="button-add-step" onClick={goToSector}>
                + Criar Novo POP
              </button>
            </div>
            <div className="steps-list-container">
              {isLoadingPops ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="loading-spinner" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid rgba(255, 255, 255, 0.1)',
                    borderTop: '4px solid #4966c6',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px'
                  }} />
                  <p>Carregando POPs...</p>
                </div>
              ) : popsInSector.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>Nenhum POP encontrado neste setor.</p>
                  <p style={{ fontSize: '14px', opacity: 0.7 }}>Clique em "Criar Novo POP" para começar.</p>
                </div>
              ) : (
                popsInSector.map((pop) => (
                  <div key={pop.id} className="pop-item" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    marginBottom: '10px'
                  }}>
                    <div>
                      <h3 style={{ margin: '0 0 8px 0', color: 'white', fontSize: '16px' }}>{pop.title}</h3>
                      <p style={{ margin: '0 0 8px 0', color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                        Categoria: {pop.category}
                      </p>
                      <p style={{ margin: '0', color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                        Versão {pop.version} | {new Date(pop.lastUpdated).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        className="button-image"
                        onClick={() => handleEditPop(pop)}
                      >
                        Editar
                      </button>
                      <button 
                        className="button-remove"
                        onClick={() => handleDeletePop(pop.id!)}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="button-group4">
            <button className="button-voltar" onClick={goToSectorSelection}>Voltar aos Setores</button>
          </div>
        </div>

        {/* Página 7: Seleção de Setor para Novo POP */}
        <div className={`page ${currentPage !== 'sector' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>{editingPopId ? 'Editando POP' : 'Qual o seu setor?'}</h1>
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
            <button className="button-voltar" onClick={isAuthenticated && !editingPopId ? goToPopManagement : goToChoice}>
              Voltar
            </button>
            <button className="button-continuar" onClick={goToPopDetails} disabled={!selectedSector}>Continuar</button>
          </div>
        </div>

        {/* Página 8: Detalhes do POP */}
        <div className={`page ${currentPage !== 'popDetails' ? 'hidden' : ''}`}>
          <div className="page-content-full-0">
            <div className="details-header">
              <h1>Defina título, descrição e categoria.</h1>
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
                
                <div className="form-group">
                  <label>Selecione a categoria</label>
                  <div className="dropdown-container" style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="dropdown-trigger"
                      onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '7px',
                        color: selectedCategory ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.4)',
                        fontSize: '14px',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <span>{selectedCategory || 'Selecione uma categoria'}</span>
                      <span style={{ transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}>
                        ▼
                      </span>
                    </button>
                    
                    {isCategoryDropdownOpen && (
                      <div 
                        className="dropdown-menu"
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          right: 0,
                          background: 'rgba(28, 28, 30, 0.95)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '7px',
                          marginTop: '4px',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          zIndex: 1000,
                          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
                        }}
                      >
                        {(adminSettings.categoriesBySector[selectedSector] && adminSettings.categoriesBySector[selectedSector].length > 0) ? (
                          adminSettings.categoriesBySector[selectedSector].map((category, idx) => (
                            <button
                              key={idx}
                              type="button"
                              className="dropdown-item"
                              onClick={() => {
                                setSelectedCategory(category);
                                setIsCategoryDropdownOpen(false);
                              }}
                              style={{
                                width: '100%',
                                padding: '12px 16px',
                                background: 'transparent',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                borderBottom: idx < adminSettings.categoriesBySector[selectedSector].length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.color = 'white';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.8)';
                              }}
                            >
                              {category}
                            </button>
                          ))
                        ) : (
                          <div style={{ padding: '12px 16px', color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', textAlign: 'center' }}>
                            Nenhuma categoria disponível para este setor
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="button-group3">
            <button className="button-voltar" onClick={() => setCurrentPage('sector')}>Voltar</button>
            <button 
              className="button-continuar" 
              onClick={goToSteps} 
              disabled={!popTitle || !popDescription || !selectedCategory}
            >
              Continuar
            </button>
          </div>
        </div>

        {/* Página 9: Passo a Passo */}
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
            <button className="button-voltar" onClick={goToPopDetails}>Voltar</button>
            <button className="button-continuar" onClick={goToCertification}>Finalizar</button>
          </div>
        </div>

        {/* Página 10: Certificação */}
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
            <button className="button-voltar" onClick={goToSteps}>Voltar</button>
            <button className="button-continuar" onClick={handleFinalSubmit} disabled={!author || !reviewer || !version}>
              {editingPopId ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>

        {/* Página 11: Tela de Salvamento */}
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
                <h1>{saveMessage}</h1>
                <p>Aguarde enquanto salvamos no banco de dados.</p>
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
                <h1>{saveMessage}</h1>
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
                    {saveMessage}
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

        {/* Página 12: Autenticação do Administrador */}
        <div className={`page ${currentPage !== 'adminAuth' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>Acesso de Administrador</h1>
            <p>Digite a senha de administrador para acessar as configurações:</p>
            <div className="form-container-vertical" style={{ maxWidth: '300px' }}>
              <input
                type="password"
                placeholder="Senha de administrador"
                className="input-field"
                value={adminPasswordInput}
                onChange={(e) => setAdminPasswordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAdminAuth()}
              />
              {adminError && (
                <p style={{ color: 'rgba(255, 85, 85, 0.9)', fontSize: '14px', margin: '10px 0 0 0' }}>
                  {adminError}
                </p>
              )}
            </div>
          </div>
          <div className="button-group2">
            <button className="button-voltar" onClick={goToWelcome}>Voltar</button>
            <button className="button-continuar" onClick={handleAdminAuth} disabled={!adminPasswordInput}>
              Acessar
            </button>
          </div>
        </div>

        {/* Página 13: Configurações do Administrador */}
        <div className={`page ${currentPage !== 'adminConfig' ? 'hidden' : ''}`}>
          <div className="page-content-full">
            <div className="steps-header">
              <h1>Configurações do Sistema</h1>
            </div>
            <div className="steps-list-container">
              
              {/* Configuração do Nome da Empresa */}
              <div className="config-section">
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Nome da Empresa</h3>
                <input
                  type="text"
                  className="input-field"
                  value={adminSettings.companyName}
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    companyName: e.target.value
                  })}
                  placeholder="Nome da empresa"
                />
              </div>

              {/* Configuração da Senha de Administrador */}
              <div className="config-section" style={{ marginTop: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Senha de Administrador</h3>
                <input
                  type="password"
                  className="input-field"
                  value={adminSettings.adminPassword}
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    adminPassword: e.target.value
                  })}
                  placeholder="Nova senha de administrador"
                />
              </div>

              {/* Configuração das Senhas dos Setores */}
              <div className="config-section" style={{ marginTop: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Senhas dos Setores</h3>
                {setores.map((setor) => (
                  <div key={setor} style={{ marginBottom: '15px' }}>
                    <label style={{ 
                      color: 'rgba(255, 255, 255, 0.7)', 
                      fontSize: '14px', 
                      marginBottom: '5px',
                      display: 'block'
                    }}>
                      {setor}
                    </label>
                    <input
                      type="password"
                      className="input-field"
                      value={adminSettings.sectorPasswords[setor] || ''}
                      onChange={(e) => setAdminSettings({
                        ...adminSettings,
                        sectorPasswords: {
                          ...adminSettings.sectorPasswords,
                          [setor]: e.target.value
                        }
                      })}
                      placeholder={`Senha para ${setor}`}
                    />
                  </div>
                ))}
              </div>

              {/* Configuração das Categorias por Setor */}
              <div className="config-section" style={{ marginTop: '30px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Categorias por Setor</h3>
                {setores.map((setor) => (
                  <div key={setor} style={{ marginBottom: '25px' }}>
                    <div className="sector-header">
                      <h4 className="sector-title">{setor}</h4>
                      <button 
                        className="button-add-step add-category-btn"
                        onClick={() => {
                          const newCategory = prompt(`Nova categoria para ${setor}:`);
                          if (newCategory && !adminSettings.categoriesBySector[setor]?.includes(newCategory as PopCategory)) {
                            setAdminSettings({
                              ...adminSettings,
                              categoriesBySector: {
                                ...adminSettings.categoriesBySector,
                                [setor]: [...(adminSettings.categoriesBySector[setor] || []), newCategory as PopCategory]
                              }
                            });
                          }
                        }}
                      >
                        + Adicionar
                      </button>
                    </div>
                    
                    <div className="sector-categories-grid">
                      {(adminSettings.categoriesBySector[setor] && adminSettings.categoriesBySector[setor].length > 0) ? (
                        adminSettings.categoriesBySector[setor].map((category, index) => (
                          <div key={index} className="category-tag">
                            <span>{category}</span>
                            {adminSettings.categoriesBySector[setor].length > 1 && (
                              <button
                                className="button-remove"
                                onClick={() => {
                                  if (window.confirm(`Remover categoria "${category}" do setor ${setor}?`)) {
                                    setAdminSettings({
                                      ...adminSettings,
                                      categoriesBySector: {
                                        ...adminSettings.categoriesBySector,
                                        [setor]: adminSettings.categoriesBySector[setor].filter((_, i) => i !== index)
                                      }
                                    });
                                  }
                                }}
                                style={{ fontSize: '10px', padding: '2px 6px' }}
                              >
                                ×
                              </button>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="no-categories">
                          Nenhuma categoria definida
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
          <div className="button-group4">
            <button className="button-voltar" onClick={goToWelcome}>Sair das Configurações</button>
            <button 
              className="button-continuar"
              onClick={() => {
                handleUpdateAdminSettings(adminSettings);
                alert('Configurações salvas com sucesso!');
              }}
            >
              Salvar Configurações
            </button>
          </div>
        </div>

      </div>

      <footer className="macos-footer">
        <div className="footer-middle">
          © {adminSettings.companyName}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;

function setIsAuthenticated(arg0: boolean) {
  throw new Error('Function not implemented.');
}
