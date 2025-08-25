// types.ts - Arquivo de tipos e constantes para o projeto

export type PopCategory = 
  | "Sistêmico" 
  | "Processual" 
  | "Cadastro" 
  | "Alteração" 
  | "Consulta"
  | "Relatório";

export type Step = {
  id: number;
  description: string;
  image: string | null;
};

export type PopData = {
  id?: number; // Para POPs já salvos no backend
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

export type AdminSettings = {
  companyName: string;
  sectorPasswords: { [sector: string]: string };
  adminPassword: string;
  categories: PopCategory[];
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

// Constantes
export const SECTORS = [
  "Administrativo", 
  "Comercial", 
  "Fiscal", 
  "Financeiro", 
  "TI", 
  "RH", 
  "Logística", 
  "Controles Internos", 
  "Manutenção"
];

export const DEFAULT_CATEGORIES: PopCategory[] = [
  "Sistêmico",
  "Processual", 
  "Cadastro",
  "Alteração",
  "Consulta",
  "Relatório"
];

// Configurações da API (substitua pela sua URL real quando pronto)
export const API_BASE_URL = "http://localhost:8080/api";

export const API_ENDPOINTS = {
  // POPs
  POPS: "/pops",
  POP_BY_ID: (id: number) => `/pops/${id}`,
  POPS_BY_SECTOR: (sector: string) => `/pops/sector/${encodeURIComponent(sector)}`,
  
  // Autenticação
  AUTH_SECTOR: "/auth/sector",
  AUTH_ADMIN: "/auth/admin",
  
  // Configurações
  SETTINGS: "/settings",
};

// Interface para o serviço de API (implementar quando backend estiver pronto)
export interface ApiService {
  // POPs
  createPop(popData: PopData): Promise<ApiResponse<PopData>>;
  updatePop(id: number, popData: PopData): Promise<ApiResponse<PopData>>;
  deletePop(id: number): Promise<ApiResponse<boolean>>;
  getPopsBySector(sector: string): Promise<ApiResponse<PopData[]>>;
  getPop(id: number): Promise<ApiResponse<PopData>>;
  
  // Autenticação
  validateSectorPassword(sector: string, password: string): Promise<ApiResponse<boolean>>;
  validateAdminPassword(password: string): Promise<ApiResponse<boolean>>;
  
  // Configurações
  getSettings(): Promise<ApiResponse<AdminSettings>>;
  updateSettings(settings: AdminSettings): Promise<ApiResponse<AdminSettings>>;
}

// Função para fazer chamadas HTTP (usar quando backend estiver pronto)
export const httpClient = {
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message || 'Erro na requisição' };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  },

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`);
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message || 'Erro na requisição' };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  },

  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        return { success: false, error: result.message || 'Erro na requisição' };
      }
      
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const result = await response.json();
        return { success: false, error: result.message || 'Erro na requisição' };
      }
      
      return { success: true };
    } catch (error) {
      return { success: false, error: `Erro de conexão: ${error}` };
    }
  }
};

// Implementação do serviço API real (para usar quando backend estiver pronto)
export const realApiService: ApiService = {
  async createPop(popData: PopData): Promise<ApiResponse<PopData>> {
    return httpClient.post<PopData>(API_ENDPOINTS.POPS, popData);
  },

  async updatePop(id: number, popData: PopData): Promise<ApiResponse<PopData>> {
    return httpClient.put<PopData>(API_ENDPOINTS.POP_BY_ID(id), popData);
  },

  async deletePop(id: number): Promise<ApiResponse<boolean>> {
    return httpClient.delete<boolean>(API_ENDPOINTS.POP_BY_ID(id));
  },

  async getPopsBySector(sector: string): Promise<ApiResponse<PopData[]>> {
    return httpClient.get<PopData[]>(API_ENDPOINTS.POPS_BY_SECTOR(sector));
  },

  async getPop(id: number): Promise<ApiResponse<PopData>> {
    return httpClient.get<PopData>(API_ENDPOINTS.POP_BY_ID(id));
  },

  async validateSectorPassword(sector: string, password: string): Promise<ApiResponse<boolean>> {
    return httpClient.post<boolean>(API_ENDPOINTS.AUTH_SECTOR, { sector, password });
  },

  async validateAdminPassword(password: string): Promise<ApiResponse<boolean>> {
    return httpClient.post<boolean>(API_ENDPOINTS.AUTH_ADMIN, { password });
  },

  async getSettings(): Promise<ApiResponse<AdminSettings>> {
    return httpClient.get<AdminSettings>(API_ENDPOINTS.SETTINGS);
  },

  async updateSettings(settings: AdminSettings): Promise<ApiResponse<AdminSettings>> {
    return httpClient.put<AdminSettings>(API_ENDPOINTS.SETTINGS, settings);
  }
};