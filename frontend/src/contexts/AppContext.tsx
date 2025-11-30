import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  functionCount: number;
  invocations24h: number;
  errorRate: number;
}

export interface FunctionConfig {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  runtime: string;
  memory: number;
  timeout: number;
  httpMethods: string[];
  environmentVariables: Record<string, string>;
  code: string;
  status: 'active' | 'disabled';
  lastModified: Date;
  lastDeployed?: Date;
  invocations24h: number;
  errors24h: number;
  avgDuration: number;
}

export interface ExecutionLog {
  id: string;
  functionId: string;
  timestamp: Date;
  status: 'success' | 'error';
  duration: number;
  statusCode: number;
  requestBody?: any;
  responseBody?: any;
  logs: string[];
  level: 'info' | 'warn' | 'error';
}

interface AppContextType {
  workspaces: Workspace[];
  functions: FunctionConfig[];
  executionLogs: ExecutionLog[];
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  createWorkspace: (name: string, description?: string) => Workspace;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  createFunction: (config: Omit<FunctionConfig, 'id' | 'lastModified' | 'invocations24h' | 'errors24h' | 'avgDuration'>) => FunctionConfig;
  updateFunction: (id: string, updates: Partial<FunctionConfig>) => void;
  deleteFunction: (id: string) => void;
  invokeFunction: (id: string, requestBody: any) => Promise<ExecutionLog>;
  getFunctionLogs: (functionId: string) => ExecutionLog[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_PYTHON_CODE = `def handler(event, context):
    """
    Handle incoming HTTP requests.
    
    Args:
        event: Dict containing request data
            - body: Request body (parsed JSON)
            - query: Query parameters
            - headers: Request headers
            - method: HTTP method
        context: Execution context
    
    Returns:
        Dict with 'statusCode' and 'body' keys
    """
    
    # Get request body
    body = event.get('body', {})
    
    # Process your logic here
    response_data = {
        'message': 'Hello from your serverless function!',
        'received': body
    }
    
    return {
        'statusCode': 200,
        'body': response_data
    }
`;

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    {
      id: 'ws-1',
      name: 'Production',
      description: 'Production environment functions',
      createdAt: new Date('2025-12-01'),
      functionCount: 1,
      invocations24h: 15420,
      errorRate: 0.2,
    },
  ]);

  const [functions, setFunctions] = useState<FunctionConfig[]>([
    {
      id: 'fn-1',
      workspaceId: 'ws-1',
      name: 'user-authentication',
      description: 'Handles user login and token generation',
      runtime: 'Python 3.12',
      memory: 256,
      timeout: 30,
      httpMethods: ['POST'],
      environmentVariables: { JWT_SECRET: 'secret-key', TOKEN_EXPIRY: '3600' },
      code: DEFAULT_PYTHON_CODE,
      status: 'active',
      lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      lastDeployed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      invocations24h: 8420,
      errors24h: 15,
      avgDuration: 145,
    },
  ]);

  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: 'log-1',
      functionId: 'fn-1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'success',
      duration: 142,
      statusCode: 200,
      requestBody: { username: 'john@example.com', password: '***' },
      responseBody: { token: 'jwt.token.here', expires: 3600 },
      logs: ['Processing authentication request', 'Token generated successfully'],
      level: 'info',
    },
  ]);

  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>('ws-1');

  const createWorkspace = (name: string, description?: string): Workspace => {
    const newWorkspace: Workspace = {
      id: `ws-${Date.now()}`,
      name,
      description,
      createdAt: new Date(),
      functionCount: 0,
      invocations24h: 0,
      errorRate: 0,
    };
    setWorkspaces([...workspaces, newWorkspace]);
    return newWorkspace;
  };

  const updateWorkspace = (id: string, updates: Partial<Workspace>) => {
    setWorkspaces(workspaces.map(ws => ws.id === id ? { ...ws, ...updates } : ws));
  };

  const deleteWorkspace = (id: string) => {
    setWorkspaces(workspaces.filter(ws => ws.id !== id));
    setFunctions(functions.filter(fn => fn.workspaceId !== id));
    if (currentWorkspaceId === id) {
      setCurrentWorkspaceId(null);
    }
  };

  const createFunction = (config: Omit<FunctionConfig, 'id' | 'lastModified' | 'invocations24h' | 'errors24h' | 'avgDuration'>): FunctionConfig => {
    const newFunction: FunctionConfig = {
      ...config,
      id: `fn-${Date.now()}`,
      lastModified: new Date(),
      lastDeployed: new Date(),
      invocations24h: 0,
      errors24h: 0,
      avgDuration: 0,
    };
    setFunctions([...functions, newFunction]);
    
    // Update workspace function count
    setWorkspaces(workspaces.map(ws => 
      ws.id === config.workspaceId 
        ? { ...ws, functionCount: ws.functionCount + 1 }
        : ws
    ));
    
    return newFunction;
  };

  const updateFunction = (id: string, updates: Partial<FunctionConfig>) => {
    setFunctions(functions.map(fn => 
      fn.id === id 
        ? { ...fn, ...updates, lastModified: new Date() }
        : fn
    ));
  };

  const deleteFunction = (id: string) => {
    const fn = functions.find(f => f.id === id);
    if (fn) {
      setFunctions(functions.filter(f => f.id !== id));
      setWorkspaces(workspaces.map(ws => 
        ws.id === fn.workspaceId 
          ? { ...ws, functionCount: Math.max(0, ws.functionCount - 1) }
          : ws
      ));
    }
  };

  const invokeFunction = async (id: string, requestBody: any): Promise<ExecutionLog> => {
    const fn = functions.find(f => f.id === id);
    if (!fn) throw new Error('Function not found');
    
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400));
    
    const success = Math.random() > 0.1; // 90% success rate
    const duration = Math.floor(80 + Math.random() * 300);
    
    const log: ExecutionLog = {
      id: `log-${Date.now()}`,
      functionId: id,
      timestamp: new Date(),
      status: success ? 'success' : 'error',
      duration,
      statusCode: success ? 200 : 500,
      requestBody,
      responseBody: success 
        ? { message: 'Function executed successfully', data: requestBody }
        : { error: 'Internal server error' },
      logs: success
        ? ['Function invoked', 'Processing request', 'Execution completed']
        : ['Function invoked', 'Processing request', 'Error: Execution failed'],
      level: success ? 'info' : 'error',
    };
    
    setExecutionLogs([log, ...executionLogs]);
    
    // Update function metrics
    setFunctions(functions.map(f => 
      f.id === id
        ? {
            ...f,
            invocations24h: f.invocations24h + 1,
            errors24h: success ? f.errors24h : f.errors24h + 1,
            avgDuration: Math.floor((f.avgDuration * f.invocations24h + duration) / (f.invocations24h + 1)),
          }
        : f
    ));
    
    return log;
  };

  const getFunctionLogs = (functionId: string): ExecutionLog[] => {
    return executionLogs.filter(log => log.functionId === functionId);
  };

  return (
    <AppContext.Provider
      value={{
        workspaces,
        functions,
        executionLogs,
        currentWorkspaceId,
        setCurrentWorkspaceId,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        createFunction,
        updateFunction,
        deleteFunction,
        invokeFunction,
        getFunctionLogs,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
