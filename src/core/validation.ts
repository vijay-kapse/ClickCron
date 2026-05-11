import { z } from 'zod';

export const automationNameSchema = z
  .string()
  .trim()
  .min(1, 'Automation name is required.')
  .max(80, 'Automation name must be 80 characters or less.')
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9-_ ]*$/, 'Automation name contains invalid characters.');

export const urlSchema = z.string().url('A valid URL is required.');

const cronSegment = '(\\*|\\?|(?:[0-5]?\\d)(?:-[0-5]?\\d)?(?:/(?:[1-5]?\\d))?)';
const cronRegex = new RegExp(
  `^${cronSegment}\\s+${cronSegment}\\s+${cronSegment}\\s+${cronSegment}\\s+${cronSegment}$`
);

export const cronSchema = z.string().trim().regex(cronRegex, 'Cron must contain 5 valid segments.');

export function validateAutomationName(name: string): string {
  return automationNameSchema.parse(name);
}

export function validateUrl(url: string): string {
  return urlSchema.parse(url);
}

export function validateCron(expression: string): string {
  return cronSchema.parse(expression);
}
