/**
 * EmailInterface defines the structure for sending emails.
 * It includes fields for the recipient's email address, subject, body,
 */
export interface EmailInterface {
  to: string; // Recipient's email address
  name: string; // Recipient's name
  subject: string; // Subject of the email
  body?: string; // Plain text content of the email
  html?: string; // HTML content of the email
  template?: string; // Optional template name for rendering the email
  attachments?: EmailAttachment[]; // Optional attachments to include in the email
}

/**
 * EmailAttachment defines the structure for attachments in an email.
 * It includes fields for the filename, file path, content, MIME type, and optional file format and size.
 */
export interface EmailAttachment {
  filename: string; // Name of the file
  filepath?: string; // Path to file on disk (if not sending content directly)
  content?: Buffer | string; // Direct content (Buffer for files, string for text)
  contentType?: string; // MIME type of the file
  fileFormat?: string; // Optional format hint (e.g., 'pdf', 'jpg')
  fileSize?: number | string; // Optional size (string or number)
}
