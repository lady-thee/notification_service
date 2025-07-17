/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/require-await */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EmailInterface } from './interfaces/email.interface';

@Injectable()
export class EmailUtils {
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

      try {
        if (emailInterface.template) {
          console.log(`Using template: ${emailInterface.template}`);
          const templatePath = path.join(
            __dirname,
            '..',
            emailInterface.template,
          );
          console.log(templatePath);
          rawTemplate = await fs.readFile(templatePath, 'utf-8');
        }
      } catch (fileError) {
        console.error('Failed to load template:' + fileError);
        throw new Error(
          `Failed to load email template: ${emailInterface.template}`,
        );
      }

      htmlContent = await this._renderTemplate(rawTemplate ?? '', {
        name,
        subject,
        body: body ?? '',
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
      return response.data;
    } catch (error) {
      console.error(
        'Failed to send email via Brevo:',
        error.response?.data || error.message,
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
