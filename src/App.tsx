import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { pictureDir } from '@tauri-apps/api/path';

type PopCategory = "";

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

type ConfirmationModal = {
  isOpen: boolean;
  type: 'deletePop' | 'deleteCategory' | 'saveSuccess' | 'addCategory' | null;
  title: string;
  message: string;
  itemId?: number | null;
  sectorName?: string;
  categoryIndex?: number;
  inputValue?: string;
  onConfirm: (inputValue?: string) => void;
  onCancel: () => void;
};

function App() {
  const [platform, setPlatform] = useState('');
  const [currentPage, setCurrentPage] = useState('welcome');

  const [selectedSector, setSelectedSector] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PopCategory | ''>('');
  const [popTitle, setPopTitle] = useState('');
  const [popDescription, setPopDescription] = useState('');
  const [steps, setSteps] = useState<Step[]>([{ id: Date.now(), description: '', image: null }]);
  const [editingPopId, setEditingPopId] = useState<number | null>(null);

  const [author, setAuthor] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [version, setVersion] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAuthSector, setCurrentAuthSector] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [popsInSector, setPopsInSector] = useState<PopData[]>([]);
  const [isLoadingPops, setIsLoadingPops] = useState(false);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminError, setAdminError] = useState('');

  const [saveStatus, setSaveStatus] = useState<'loading' | 'success' | 'error' | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const [confirmationModal, setConfirmationModal] = useState<ConfirmationModal>({
    isOpen: false,
    type: null,
    title: '',
    message: '',
    itemId: null,
    sectorName: '',
    categoryIndex: -1,
    onConfirm: () => { },
    onCancel: () => { }
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    companyName: "Novo Mix Supermercados",
    sectorPasswords: {
      "Administrativo": "@novomix@",
      "Comercial": "@novomix@",
      "Fiscal": "@novomix@",
      "Financeiro": "@novomix@",
      "TI": "@novomix@",
      "RH": "@novomix@",
      "Logística": "@novomix@",
      "Controles Internos": "@novomix@",
      "Manutenção": "@novomix@",
      "Recepção": "@novomix@"
    },
    adminPassword: "#admin#",
    categoriesBySector: {
      "Administrativo": [],
      "Comercial": [],
      "Fiscal": [],
      "Financeiro": [],
      "TI": [],
      "RH": [],
      "Logística": [],
      "Controles Internos": [],
      "Manutenção": [],
      "Recepção": []
    }
  });

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));

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

  const setores = ["Administrativo", "Comercial", "Fiscal", "Financeiro", "TI", "RH", "Logística", "Controles Internos", "Manutenção", "Recepção"];

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
    setConfirmationModal({
      isOpen: false,
      type: null,
      title: '',
      message: '',
      itemId: null,
      sectorName: '',
      categoryIndex: -1,
      inputValue: '',
      onConfirm: () => { },
      onCancel: () => { }
    });
  };


  const handleSectorAuth = async () => {
    const isValid = adminSettings.sectorPasswords[currentAuthSector] === passwordInput;

    if (isValid) {
      setIsAuthenticated(true);
      setAuthError('');
      setPasswordInput('');
      loadPopsForSector(currentAuthSector);
    } else {
      setAuthError('Senha incorreta');
    }
  };

  const handleAdminAuth = async () => {
    const isValid = adminSettings.adminPassword === adminPasswordInput;

    if (isValid) {
      setIsAdminMode(true);
      setAdminError('');
      setAdminPasswordInput('');
      goToAdminConfig();
    } else {
      setAdminError('Senha de administrador incorreta');
    }
  };

  const loadPopsForSector = async (sector: string) => {
    setIsLoadingPops(true);
    try {
      // TODO: Implementar busca real no backend
      // const result = await fetch(`/api/pops/sector/${sector}`);
      setPopsInSector([]); // Por enquanto lista vazia até implementar backend
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

  const handleDeletePop = (id: number) => {
    setConfirmationModal({
      isOpen: true,
      type: 'deletePop',
      title: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja excluir?',
      itemId: id,
      onConfirm: () => confirmDeletePop(id),
      onCancel: cancelModal
    });
  };

  const confirmDeletePop = async (id: number) => {
    try {
      // TODO: Implementar exclusão real no backend
      // await fetch(`/api/pops/${id}`, { method: 'DELETE' });
      setPopsInSector(pops => pops.filter(pop => pop.id !== id));
      setConfirmationModal({
        ...confirmationModal,
        isOpen: false
      });
    } catch (error) {
      console.error('Error deleting POP:', error);
    }
  };

  const handleDeleteCategory = (sectorName: string, categoryIndex: number, categoryName: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'deleteCategory',
      title: 'Confirmar Exclusão de Categoria',
      message: `Tem certeza que deseja remover a categoria "${categoryName}"?`,
      sectorName,
      categoryIndex,
      onConfirm: () => confirmDeleteCategory(sectorName, categoryIndex),
      onCancel: cancelModal
    });
  };

  const confirmDeleteCategory = (sectorName: string, categoryIndex: number) => {
    setAdminSettings({
      ...adminSettings,
      categoriesBySector: {
        ...adminSettings.categoriesBySector,
        [sectorName]: adminSettings.categoriesBySector[sectorName].filter((_, i) => i !== categoryIndex)
      }
    });

    setConfirmationModal({
      ...confirmationModal,
      isOpen: false
    });
  };

  const cancelModal = () => {
    setConfirmationModal({
      ...confirmationModal,
      isOpen: false
    });
  };

  const handleSectorChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedSector(event.target.value);
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

  const handleFinalSubmit = async () => {
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

      // TODO: Implementar chamadas reais para o backend
      if (editingPopId) {
        // await fetch(`/api/pops/${editingPopId}`, { method: 'PUT', body: JSON.stringify(popData) });
        setSaveMessage('Procedimento atualizado com sucesso!');
      } else {
        // await fetch('/api/pops', { method: 'POST', body: JSON.stringify(popData) });
        setSaveMessage('Procedimento criado com sucesso!');
      }

      setSaveStatus('success');
      setTimeout(() => {
        resetAllStates();
        goToWelcome();
      }, 3000);

    } catch (error) {
      setSaveStatus('error');
      setSaveMessage(`Erro ao salvar: ${error}`);
    }
  };

  const handleUpdateAdminSettings = (newSettings: AdminSettings) => {
    setAdminSettings(newSettings);
    // TODO: Implementar chamada real para o backend
    // await fetch('/api/settings', { method: 'PUT', body: JSON.stringify(newSettings) });

    // Exibir modal de sucesso
    setConfirmationModal({
      isOpen: true,
      type: 'saveSuccess',
      title: 'Configurações Salvas',
      message: 'As configurações do sistema foram salvas com sucesso!',
      onConfirm: () => {
        setConfirmationModal({
          ...confirmationModal,
          isOpen: false
        });
      },
      onCancel: () => {
        setConfirmationModal({
          ...confirmationModal,
          isOpen: false
        });
      }
    });
  };

  const addCategoryToSector = (sectorName: string) => {
    setConfirmationModal({
      isOpen: true,
      type: 'addCategory',
      title: 'Adicionar Nova Categoria',
      message: `Digite o nome da categoria:`,
      sectorName: sectorName,
      inputValue: '',
      onConfirm: (inputValue) => {
        if (inputValue && inputValue.trim() && !adminSettings.categoriesBySector[sectorName]?.includes(inputValue.trim() as PopCategory)) {
          setAdminSettings({
            ...adminSettings,
            categoriesBySector: {
              ...adminSettings.categoriesBySector,
              [sectorName]: [...(adminSettings.categoriesBySector[sectorName] || []), inputValue.trim() as PopCategory]
            }
          });
        }
        setConfirmationModal({
          ...confirmationModal,
          isOpen: false
        });
      },
      onCancel: () => {
        setConfirmationModal({
          ...confirmationModal,
          isOpen: false
        });
      }
    });
  };

  return (
    <div className={isWindows ? "window" : "macos-window"}>
      {/* Title Bar */}
      {isWindows ? (
        <div className="titlebar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px', height: '32px', '-webkit-app-region': 'drag' } as any}>
          <div className="window-title">do-pop</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', '-webkit-app-region': 'no-drag' } as any}>
            <button
              className="admin-gear-btn"
              onClick={goToAdminAuth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                minWidth: '28px',
                height: '24px',
                display: 'flex',
                alignItems: 'flex-end',
                marginTop: '4px'
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
              ⚙︎
            </button>
            <button onClick={() => appWindow.minimize()} style={{ minWidth: '28px' }}><span>–</span></button>
            <button onClick={() => appWindow.toggleMaximize()} style={{ minWidth: '28px' }}>+</button>
            <button onClick={() => appWindow.close()} style={{ minWidth: '28px' }}>×</button>
          </div>
        </div>
      ) : (
        <div className="titlebar" data-tauri-drag-region>
          <div className="window-title">do-pop</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', '-webkit-app-region': 'no-drag' } as any}>
            <button
              className="admin-gear-btn"
              onClick={goToAdminAuth}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '12px',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                transition: 'all 0.2s ease',
                minWidth: '28px',
                height: '24px',
                display: 'flex',
                alignItems: 'flex-end',
                marginTop: '4px',
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
              ⚙︎
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
              Este aplicativo vai te ajudar a <strong><strong>documentar</strong></strong>, <strong><strong>gerenciar</strong></strong> e <strong><strong>padronizar</strong></strong> todos os procedimentos operacionais padrão do seu setor.
            </p>
            <p>
              Qualquer dúvida, {' '}
              <a
                href="http://192.168.130.125/" /* link do glpi */
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#64affaff', textDecoration: 'none' }}
              >

                clique aqui.
              </a>
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
            <p>Selecione uma opção para <strong><strong>criar</strong></strong> um novo procedimento operacional padrão<p>ou <strong><strong>editar</strong></strong> um procedimento operacional existente do seu setor</p> </p>
          </div>
          <div className="button-group">
            <button className="button-voltar" onClick={goToAbout}>Voltar</button>
            <button className="button-iniciar" onClick={goToSectorSelection}>Editar</button>
            <button className="button-iniciar" onClick={goToSector}>Criar</button>

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
          <div className="button-group10">
            <button className="button-voltar" onClick={goToChoice}>Voltar</button>
          </div>
        </div>

        {/* Página 5: Autenticação do Setor */}
        <div className={`page ${currentPage !== 'sectorAuth' ? 'hidden' : ''}`}>
          <div className="page-content">
            <h1>{currentAuthSector}</h1>
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
                <p style={{ color: 'rgba(255, 85, 85, 0.9)', fontSize: '14px', margin: '-14px 0 0 0' }}>
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
              <h1>POPs {currentAuthSector}</h1>
              <button className="button-add-step" onClick={goToSector}>
                +
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
                  <p style={{ fontSize: '14px', opacity: 0.7 }}>Clique em "+" para começar.</p>
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
            <button className="button-voltar" onClick={isAuthenticated && !editingPopId ? goToChoice : goToChoice}>
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
            <h1>Painel administrativo </h1>
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
          <div className="button-group11">
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
              <h1>Configurações do sistema</h1>
            </div>
            <div className="steps-list-container">

              {/* Configuração do Nome da Empresa */}
              <div className="config-section">
                <h3 style={{ color: 'white', marginBottom: '6px', fontSize: '14px', paddingLeft: '2px' }}>Nome da Empresa</h3>
                <input
                  type="text"
                  className="input-field"
                  value={adminSettings.companyName}
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    companyName: e.target.value
                  })}
                  placeholder="Digite o mome da sua empresa"
                />
              </div>

              {/* Configuração da Senha de Administrador */}
              <div className="config-section" style={{ marginTop: '-40px' }}>
                <h3 style={{ color: 'white', marginBottom: '6px', fontSize: '14px', paddingLeft: '2px' }}>Senha de Administrador</h3>
                <input
                  type="password"
                  className="input-field"
                  value={adminSettings.adminPassword}
                 
                  onChange={(e) => setAdminSettings({
                    ...adminSettings,
                    adminPassword: e.target.value
                  })}
                  placeholder="Digite a nova senha de administrador"
                />
                <hr
                  style={{
                    border: 'none',           
                    borderTop: '1px solid #676767ff', 
                    width: '80%',        
                    margin: '20px auto'     
                  }}
                />
              </div>

              {/* Configuração das Senhas dos Setores */}
              <div className="config-section" style={{ marginTop: '-25px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Gerenciamento por setor (senhas)</h3>
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

                 <hr
                  style={{
                    border: 'none',           
                    borderTop: '1px solid #676767ff', 
                    width: '80%',        
                    margin: '20px auto'     
                  }}
                />
              </div>

              {/* Configuração das Categorias por Setor */}
              <div className="config-section" style={{ marginTop: '-25px' }}>
                <h3 style={{ color: 'white', marginBottom: '15px', fontSize: '18px' }}>Categorias por Setor</h3>
                {setores.map((setor) => (
                  <div key={setor} style={{ marginBottom: '15px' }}>
                    <div className="sector-header">
                      <h4 className="sector-title">{setor}</h4>
                      <button
                        className="button-add-step add-category-btn"
                        onClick={() => addCategoryToSector(setor)}
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
                                onClick={() => handleDeleteCategory(setor, index, category)}
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
          <div className="button-group12">
            <button className="button-voltar" onClick={goToWelcome}>Cancelar</button>
            <button
              className="button-continuar"
              onClick={() => handleUpdateAdminSettings(adminSettings)}
            >
              Salvar
            </button>
          </div>
        </div>

      </div>

      {/* Modal de Confirmação Unificado */}
      {confirmationModal.isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor:
                confirmationModal.type === 'saveSuccess' ? 'rgba(76, 175, 80, 0.2)' :
                  confirmationModal.type === 'addCategory' ? 'rgba(73, 102, 198, 0.2)' :
                    'rgba(255, 85, 85, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              fontSize: '24px',
              color:
                confirmationModal.type === 'saveSuccess' ? '#4CAF50' :
                  confirmationModal.type === 'addCategory' ? '#4966c6' :
                    '#ff5555'
            }}>
              {confirmationModal.type === 'saveSuccess' ? '✓' :
                confirmationModal.type === 'addCategory' ? '+' : '⚠️'}
            </div>

            <h2 style={{
              color: 'white',
              fontSize: '18px',
              fontWeight: '500',
              marginBottom: '12px'
            }}>
              {confirmationModal.title}
            </h2>

            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              marginBottom: confirmationModal.type === 'addCategory' ? '16px' : '24px',
              lineHeight: '1.4'
            }}>
              {confirmationModal.message}
            </p>

            {/* Input para adicionar categoria */}
            {confirmationModal.type === 'addCategory' && (
              <input
                type="text"
                className="input-field"
                placeholder="Nome da categoria"
                value={confirmationModal.inputValue || ''}
                onChange={(e) => setConfirmationModal({
                  ...confirmationModal,
                  inputValue: e.target.value
                })}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && confirmationModal.inputValue?.trim()) {
                    confirmationModal.onConfirm(confirmationModal.inputValue.trim());
                  }
                }}
                style={{
                  marginBottom: '24px',
                  width: '100%'
                }}
                autoFocus
              />
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              {confirmationModal.type !== 'saveSuccess' && (
                <button
                  className="button-voltar"
                  onClick={confirmationModal.onCancel}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
              )}
              <button
                onClick={() => {
                  if (confirmationModal.type === 'addCategory') {
                    confirmationModal.onConfirm(confirmationModal.inputValue?.trim());
                  } else {
                    confirmationModal.onConfirm();
                  }
                }}
                disabled={confirmationModal.type === 'addCategory' && !confirmationModal.inputValue?.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  backgroundColor:
                    confirmationModal.type === 'saveSuccess' ? 'rgba(76, 175, 80, 0.2)' :
                      confirmationModal.type === 'addCategory' ? 'rgba(73, 102, 198, 0.2)' :
                        'rgba(255, 85, 85, 0.2)',
                  border:
                    confirmationModal.type === 'saveSuccess' ? '1px solid rgba(76, 175, 80, 0.4)' :
                      confirmationModal.type === 'addCategory' ? '1px solid rgba(73, 102, 198, 0.4)' :
                        '1px solid rgba(255, 85, 85, 0.4)',
                  color:
                    confirmationModal.type === 'saveSuccess' ? '#4CAF50' :
                      confirmationModal.type === 'addCategory' ? '#4966c6' :
                        '#ff8a8a',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: (confirmationModal.type === 'addCategory' && !confirmationModal.inputValue?.trim()) ? 0.5 : 1
                }}
                onMouseEnter={(e) => {
                  if (confirmationModal.type === 'addCategory' && !confirmationModal.inputValue?.trim()) return;

                  if (confirmationModal.type === 'saveSuccess') {
                    e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.3)';
                    e.currentTarget.style.color = '#45a049';
                  } else if (confirmationModal.type === 'addCategory') {
                    e.currentTarget.style.backgroundColor = 'rgba(73, 102, 198, 0.3)';
                    e.currentTarget.style.color = '#3d5af1';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.3)';
                    e.currentTarget.style.color = '#ff6666';
                  }
                }}
                onMouseLeave={(e) => {
                  if (confirmationModal.type === 'saveSuccess') {
                    e.currentTarget.style.backgroundColor = 'rgba(76, 175, 80, 0.2)';
                    e.currentTarget.style.color = '#4CAF50';
                  } else if (confirmationModal.type === 'addCategory') {
                    e.currentTarget.style.backgroundColor = 'rgba(73, 102, 198, 0.2)';
                    e.currentTarget.style.color = '#4966c6';
                  } else {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 85, 85, 0.2)';
                    e.currentTarget.style.color = '#ff8a8a';
                  }
                }}
              >
                {confirmationModal.type === 'saveSuccess'
                  ? 'OK'
                  : confirmationModal.type === 'addCategory'
                    ? 'Adicionar'
                    : confirmationModal.type === 'deletePop'
                      ? 'Excluir POP'
                      : 'Excluir Categoria'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="macos-footer">
        <div className="footer-middle">
          © {adminSettings.companyName}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;