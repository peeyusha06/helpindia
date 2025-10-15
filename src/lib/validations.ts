import { z } from 'zod';

// Signup validation schema
export const signupSchema = z.object({
  name: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.enum(['volunteer', 'donor'], {
    errorMap: () => ({ message: 'Role must be either volunteer or donor' })
  })
});

// Login validation schema
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password must be less than 128 characters'),
  role: z.enum(['volunteer', 'donor', 'ngo'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

// Event creation validation schema
export const eventSchema = z.object({
  title: z.string()
    .trim()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be less than 200 characters'),
  slug: z.string()
    .trim()
    .min(3, 'Slug must be at least 3 characters')
    .max(200, 'Slug must be less than 200 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string()
    .trim()
    .max(2000, 'Description must be less than 2000 characters')
    .optional(),
  location: z.string()
    .trim()
    .min(3, 'Location must be at least 3 characters')
    .max(300, 'Location must be less than 300 characters'),
  capacity: z.number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity must be less than 10,000'),
  dateTime: z.string()
    .refine((val) => {
      const date = new Date(val);
      return date > new Date();
    }, 'Event date must be in the future')
});

// Donation validation schema
export const donationSchema = z.object({
  amount: z.number()
    .positive('Amount must be positive')
    .min(1, 'Minimum donation amount is ₹1')
    .max(1000000, 'Maximum donation amount is ₹1,000,000'),
  campaign: z.string()
    .trim()
    .min(2, 'Campaign name must be at least 2 characters')
    .max(100, 'Campaign name must be less than 100 characters')
});
