import { useEffect, useState, ChangeEvent } from 'react';
import './App.css';
import { invoke } from '@tauri-apps/api/core';
import { Window } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-dialog';
import { pictureDir, documentDir } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, writeFile, exists, mkdir, readFile } from '@tauri-apps/plugin-fs';
import { Document, Page, Text, View, StyleSheet, pdf, Image } from '@react-pdf/renderer';
import React from 'react';

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

// Estilos do PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#333',
    paddingBottom: 15,
    textAlign: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
    marginTop: 10
  },
  infoItem: {
    flex: 1,
    fontSize: 10
  },
  infoLabel: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  infoValue: {
    color: '#555'
  },
  sectorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 10
  },
  popTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    marginTop: 20
  },
  descriptionBox: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20
  },
  descriptionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  descriptionText: {
    fontSize: 11,
    color: '#555',
    lineHeight: 1.6
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottom: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 8
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    padding: 15,
    border: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#fafafa'
  },
  stepNumber: {
    width: 25,
    height: 25,
    backgroundColor: '#4966c6',
    color: 'white',
    borderRadius: 12.5,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 10,
    paddingTop: 6
  },
  stepContent: {
    flex: 1
  },
  stepText: {
    fontSize: 11,
    color: '#333',
    lineHeight: 1.6,
    marginBottom: 10
  },
  stepImage: {
    width: '100%',
    maxHeight: 200,
    objectFit: 'contain',
    border: 1,
    borderColor: '#ddd',
    borderRadius: 3
  },
  imageCaption: {
    fontSize: 9,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 5
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTop: 1,
    borderTopColor: '#ddd',
    paddingTop: 15
  },
  footerText: {
    fontSize: 10,
    color: '#666'
  }
});

// Componente do PDF
const PopPDF = ({ popData }: { popData: PopData }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>PROCEDIMENTO OPERACIONAL PADRÃO</Text>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Elaborado por:</Text>
            <Text style={styles.infoValue}>{popData.author}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Revisado por:</Text>
            <Text style={styles.infoValue}>{popData.reviewer}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Versão:</Text>
            <Text style={styles.infoValue}>{popData.version}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Data:</Text>
            <Text style={styles.infoValue}>
              {new Date(popData.createdAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
        
        <Text style={styles.sectorText}>Setor: {popData.sector}</Text>
      </View>

      {/* Título e Descrição */}
      <Text style={styles.popTitle}>{popData.title}</Text>
      
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionTitle}>Descrição:</Text>
        <Text style={styles.descriptionText}>{popData.description}</Text>
      </View>

      {/* Passos */}
      <Text style={styles.stepsTitle}>Passo a Passo:</Text>
      
      {popData.steps.map((step, index) => (
        <View key={step.id} style={styles.stepContainer}>
          <Text style={styles.stepNumber}>{index + 1}</Text>
          <View style={styles.stepContent}>
            <Text style={styles.stepText}>{step.description}</Text>
            {step.image && (
              <View>
                <Image src={step.image} style={styles.stepImage} />
                <Text style={styles.imageCaption}>
                  Figura {index + 1}: {step.image.split(/[\\/]/).pop()}
                </Text>
              </View>
            )}
          </View>
        </View>
      ))}

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © Novo Mix Supermercados. Todos os direitos reservados.
        </Text>
        <Text style={styles.footerText}>
          Última atualização: {new Date(popData.lastUpdated).toLocaleDateString('pt-BR')}
        </Text>
      </View>
    </Page>
  </Document>
);

function App() {
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
  const [savePaths, setSavePaths] = useState<{pdfPath: string, jsonPath: string} | null>(null);

  useEffect(() => {
    invoke('get_platform').then((p: unknown) => setPlatform(p as string));
  }, []);

  const isWindows = platform === 'windows';
  const appWindow = Window.getCurrent();

  // --- Funções de Navegação ---
  const goToWelcome = () => {
    setCurrentPage('welcome');
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

  // Função para determinar o caminho base por setor
  const getSectorPath = (sector: string): string => {
    // Seu caminho especificado
    const basePath = "C:/Users/ymuri/OneDrive/Área de Trabalho/do-pop";
    
    // Mapeamento de setores para pastas específicas
    const sectorPaths: { [key: string]: string } = {
      "Administrativo": `${basePath}/Administrativo`,
      "Comercial": `${basePath}/Comercial`,
      "Fiscal": `${basePath}/Fiscal`,
      "Financeiro": `${basePath}/Financeiro`,
      "TI": `${basePath}/TI`,
      "RH": `${basePath}/RH`,
      "Logística": `${basePath}/Logistica`,
      "Controles Internos": `${basePath}/ControlesInternos`,
      "Manutenção": `${basePath}/Manutencao`
    };
    
    return sectorPaths[sector] || `${basePath}/Geral`;
  };

  const handleSaveJson = async (popData: PopData): Promise<string> => {
    try {
      const fileName = `${popData.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.json`;
      
      // Usar o caminho específico do setor
      const sectorBasePath = getSectorPath(popData.sector);
      const jsonFolder = `${sectorBasePath}/json`;
      
      // Criar as pastas se não existirem
      if (!(await exists(sectorBasePath))) {
        await mkdir(sectorBasePath, { recursive: true });
      }
      if (!(await exists(jsonFolder))) {
        await mkdir(jsonFolder, { recursive: true });
      }
      
      const filePath = `${jsonFolder}/${fileName}`;
      await writeTextFile(filePath, JSON.stringify(popData, null, 2));
      console.log(`JSON salvo em: ${filePath}`);
      
      return jsonFolder;
    } catch (error) {
      console.error("Erro ao salvar o arquivo JSON:", error);
      throw error;
    }
  };

  const handleJsonFileSelect = async () => {
    try {
      const documentsPath = await documentDir();
      const selectedPath = await open({
        multiple: false,
        filters: [{ name: 'JSON', extensions: ['json'] }],
        defaultPath: documentsPath,
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

  // Função para converter imagem local para base64 compatível com React-PDF
  const convertImageToBase64 = async (imagePath: string): Promise<string> => {
    try {
      const imageData = await readFile(imagePath);
      
      let binary = '';
      const len = imageData.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(imageData[i]);
      }
      const base64 = btoa(binary);
      
      const extension = imagePath.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Erro ao converter imagem:', error);
      return '';
    }
  };

  const handleGeneratePdf = async (popData: PopData): Promise<string> => {
    try {
      // Processar imagens dos passos para base64
      const processedSteps = await Promise.all(
        popData.steps.map(async (step) => {
          let imageBase64 = '';
          if (step.image) {
            imageBase64 = await convertImageToBase64(step.image);
          }
          return { ...step, image: imageBase64 || step.image };
        })
      );

      const processedPopData = { ...popData, steps: processedSteps };

      // Gerar PDF usando React-PDF
      const pdfDoc = <PopPDF popData={processedPopData} />;
      const blob = await pdf(pdfDoc).toBlob();
      
      // Converter blob para ArrayBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Definir caminho e nome do arquivo
      const fileName = `${popData.title.replace(/[\s/\\?%*:|"<>]/g, '_')}.pdf`;
      const sectorBasePath = getSectorPath(popData.sector);
      const pdfFolder = `${sectorBasePath}/pdf`;
      
      // Criar pastas se necessário
      if (!(await exists(sectorBasePath))) {
        await mkdir(sectorBasePath, { recursive: true });
      }
      if (!(await exists(pdfFolder))) {
        await mkdir(pdfFolder, { recursive: true });
      }
      
      // Salvar arquivo
      const filePath = `${pdfFolder}/${fileName}`;
      await writeFile(filePath, uint8Array);
      
      console.log(`PDF salvo em: ${filePath}`);
      return pdfFolder;
      
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
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

      await new Promise(resolve => setTimeout(resolve, 500));

      // Salvar JSON e PDF, capturando os caminhos
      const jsonPath = await handleSaveJson(popData);
      const pdfPath = await handleGeneratePdf(popData);

      // Armazenar os caminhos para exibir na tela de sucesso
      setSavePaths({ pdfPath, jsonPath });
      setSaveStatus('success');
      setIsLoading(false);

      setTimeout(() => {
        resetAllData();
        goToWelcome();
      }, 5000);

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

        {/* Página 9: Tela de Salvamento */}
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
                <p>Aguarde enquanto salvamos os arquivos no caminho especificado.</p>
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
                <p>PDF salvo em: {savePaths?.pdfPath || 'C:/Users/ymuri/OneDrive/Área de Trabalho/do-pop/[Setor]/pdf/'}</p>
                <p>JSON salvo em: {savePaths?.jsonPath || 'C:/Users/ymuri/OneDrive/Área de Trabalho/do-pop/[Setor]/json/'}</p>
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

      <footer className="macos-footer">
        <div className="footer-middle">
          © Novo Mix Supermercados. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}

export default App;