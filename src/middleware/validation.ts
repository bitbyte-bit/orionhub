import { z } from 'zod';

// User validation schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  photoURL: z.string().url().optional(),
});

// Business validation schemas
export const businessSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.string().min(1, 'Category is required'),
  address: z.string().min(5, 'Address is required').max(200),
  phone: z.string().min(5, 'Valid phone number required').max(20),
  email: z.string().email('Invalid email address'),
  website: z.string().url().optional().or(z.literal('')),
});

// Product validation schemas
export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100),
  description: z.string().min(10).max(2000),
  price: z.number().positive('Price must be positive').max(1000000),
  category: z.string().min(1),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  image: z.string().url().optional(),
});

// Negotiation validation schemas
export const negotiationMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(1000),
  offerPrice: z.number().positive().optional(),
});

// Review validation schemas
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(500),
  productId: z.string().uuid(),
});

// Order validation schemas
export const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1),
  shippingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(3),
    country: z.string().min(2),
  }),
  paymentMethod: z.enum(['card', 'paypal', 'bank_transfer']),
});

// Payment validation schemas
export const paymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  orderId: z.string().uuid(),
});

// Utility function to validate data
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.issues.map(issue => issue.message);
  return { success: false, errors };
}

// Middleware factory for validation
export function validateRequest(schema: z.ZodSchema<any>) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors 
      });
    }
    
    req.validatedData = result.data;
    next();
  };
}
