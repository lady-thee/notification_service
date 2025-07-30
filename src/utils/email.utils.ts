/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailInterface } from './interfaces/email.interface';

@Injectable()
export class EmailUtils {
  private readonly logger = new Logger('EmailSender');
  constructor(private readonly configService: ConfigService) {}

  private async _renderTemplate(
    template: string,
    data: Record<string, string | number>,
  ) {
    return Object.entries(data).reduce((result, [key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g');
      return result.replace(regex, String(value));
    }, template);
  }
  /**
   * Sends an email using the Brevo API.
   * @param emailInterface - An object containing email details such as recipient, subject, body, and optional template.
   * @returns A promise that resolves to the response from the Brevo API.
   * @throws An error if the email configuration is missing or if the API request fails.
   */
  async sendEmail(emailInterface: EmailInterface) {
    try {
      console.log(this.configService);
      console.log(`Sending email to: ${emailInterface.to}`);
      const sender = this.configService.get<string>('BREVO_EMAIL');
      const apiKey = this.configService.get<string>('BREVO_API_KEY');
      const emailUrl = this.configService.get<string>('BREVO_API_URL');

      //   console.log('DEBUG: BREVO_EMAIL from ConfigService:', sender);
      //   console.log('DEBUG: BREVO_API_KEY from ConfigService:', apiKey);
      //   console.log('DEBUG: BREVO_EMAIL_URL from ConfigService:', emailUrl);

      if (!sender || !apiKey || !emailUrl) {
        throw new Error('Email configuration is missing');
      }

      const subject = emailInterface.subject;
      const body = emailInterface.body;
      const to = emailInterface.to;
      const name = emailInterface.name;
      let htmlContent: string | null = null;
      let rawTemplate: string | null = null;

      console.log(body);

      try {
        if (emailInterface.template) {
          console.log(`Using template: ${emailInterface.template}`);
          this.logger.log(`Using template: ${emailInterface.template}`);

          // Load the template from the file system
          const templatePath = path.join(
            __dirname,
            '..',
            'utils',
            'templates',
            emailInterface.template,
          );
          console.log(templatePath);
          rawTemplate = await fs.readFile(templatePath, 'utf-8');
        }
      } catch (fileError) {
        console.error('Failed to load template:' + fileError);
        this.logger.error(
          `Failed to load template: ${emailInterface.template}`,
          fileError,
        );
        throw new Error(
          `Failed to load email template: ${emailInterface.template}`,
        );
      }

      if (!rawTemplate) {
        console.warn('No template provided, using default HTML content.');
      }
      // Render the template with provided data
      htmlContent = await this._renderTemplate(rawTemplate ?? '', {
        name,
        subject,
        body: body ?? '',
        supportEmail: this.configService.get<string>('BREVO_EMAIL') ?? '',
        year: new Date().getFullYear(),
      });

      const emailData: any = {
        sender: {
          email: sender,
          name: this.configService.get<string>('BREVO_NAME'),
        },
        to: [{ email: to, name: name }],
        subject: subject,
        htmlContent: htmlContent ? htmlContent : null,
        textContent: body ? body : null,
      };
      const response = await axios.post(emailUrl, emailData, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
      });
      console.log('Email sent successfully:', response.data);
      this.logger.log(`Email sent successfully to ${to}`);
      return response.data;
    } catch (error) {
      console.error(
        'Failed to send email via Brevo:',
        error.response?.data || error.message,
      );
      this.logger.error(
        `Failed to send email to ${emailInterface.to}: ${error.message}`,
      );
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(
          `Brevo API Error: ${JSON.stringify(error.response.data)} (Status: ${error.response.status})`,
        );
      }
      throw error;
    }
  }
}
