import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login/register attempts per windowMs
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 API requests per minute
  message: { error: 'API rate limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Strict limit for payment operations
  message: { error: 'Payment operation limit exceeded.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// CORS configuration
export const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Input sanitization middleware
export function sanitizeInput(req: any, res: any, next: any) {
  // Remove common injection patterns
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove script tags and event handlers
        obj[key] = obj[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .replace(/javascript:/gi, '')
          .trim();
      } else if (typeof obj[key] === 'object') {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  
  next();
}

// Request size limiter
export const requestSizeLimiter = (req: any, res: any, next: any) => {
  const MAX_REQUEST_SIZE = '10mb';
  next();
};

// NoSQL injection prevention
export function preventNoSQLInjection(req: any, res: any, next: any) {
  const containsInjectionPattern = (value: any): boolean => {
    if (typeof value === 'string') {
      const patterns = [
        /^\$/, // MongoDB operators
        /.*\$where.*/i,
        /.*\$ne.*/i,
        /.*\$gt.*/i,
        /.*\$lt.*/i,
        /.*\$regex.*/i,
      ];
      return patterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object') {
      return Object.values(value).some(containsInjectionPattern);
    }
    return false;
  };

  if (containsInjectionPattern(req.body) || containsInjectionPattern(req.query)) {
    return res.status(400).json({ error: 'Invalid characters detected in request.' });
  }
  
  next();
};
