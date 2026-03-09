import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';

export interface AuditLog {
  timestamp: string;
  userId?: string;
  email?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ip: string;
  userAgent: string;
  status: 'success' | 'failure';
  details?: any;
}

class AuditLogger {
  private logFilePath: string;
  private logs: AuditLog[] = [];
  private maxLogsInMemory = 100;

  constructor() {
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    this.logFilePath = path.join(logsDir, 'audit.log');
  }

  private formatLog(log: AuditLog): string {
    return JSON.stringify({
      ...log,
      timestamp: new Date(log.timestamp).toISOString(),
    }) + '\n';
  }

  log(entry: AuditLog) {
    this.logs.push(entry);
    
    // Write to file
    fs.appendFileSync(this.logFilePath, this.formatLog(entry));
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }
  }

  getRecentLogs(limit = 100): AuditLog[] {
    return this.logs.slice(-limit);
  }

  getLogsByUser(userId: string, limit = 50): AuditLog[] {
    return this.logs.filter(log => log.userId === userId).slice(-limit);
  }

  getLogsByAction(action: string, limit = 50): AuditLog[] {
    return this.logs.filter(log => log.action === action).slice(-limit);
  }
}

export const auditLogger = new AuditLogger();

// Express middleware for audit logging
export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;
  const startTime = Date.now();

  res.send = function (body: any) {
    const user = (req as any).user;
    const status = res.statusCode >= 400 ? 'failure' : 'success';
    
    const auditEntry: AuditLog = {
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      action: req.method,
      resource: req.path,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status,
      details: {
        method: req.method,
        query: req.query,
        statusCode: res.statusCode,
        responseTime: Date.now() - startTime,
      },
    };

    auditLogger.log(auditEntry);
    return originalSend.call(this, body);
  };

  next();
}

// Specific audit loggers for different actions
export const audit = {
  login: (req: Request, user: any, success: boolean) => {
    auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      action: 'LOGIN',
      resource: '/api/auth/login',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status: success ? 'success' : 'failure',
      details: { email: user?.email },
    });
  },

  logout: (req: Request, userId: string) => {
    auditLogger.log({
      timestamp: new Date().toISOString(),
      userId,
      action: 'LOGOUT',
      resource: '/api/auth/logout',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status: 'success',
    });
  },

  register: (req: Request, user: any) => {
    auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: user?.id,
      email: user?.email,
      action: 'REGISTER',
      resource: '/api/auth/register',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status: 'success',
    });
  },

  payment: (req: Request, userId: string, amount: number, status: 'success' | 'failure') => {
    auditLogger.log({
      timestamp: new Date().toISOString(),
      userId,
      action: 'PAYMENT',
      resource: '/api/payments',
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status,
      details: { amount },
    });
  },

  adminAction: (req: Request, adminId: string, action: string, targetId: string) => {
    auditLogger.log({
      timestamp: new Date().toISOString(),
      userId: adminId,
      action: `ADMIN_${action}`,
      resource: `/api/admin/${action}`,
      resourceId: targetId,
      ip: req.ip || req.socket.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      status: 'success',
    });
  },
};
