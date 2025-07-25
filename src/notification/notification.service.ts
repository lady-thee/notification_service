/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/app.service';
import { EmailUtils } from 'src/utils/email.utils';
import { EmailInterface } from 'src/utils/interfaces/email.interface';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailUtils: EmailUtils,
  ) {}

  async sendWelcomeEmailAndLog(data: { email: string; name: string }) {
    const emailDetails: EmailInterface = {
      to: data.email,
      name: data.name,
      subject: 'Welcome to the Order Platform!',
      body: `Hi ${data.name}, welcome to our platform!`,
      template: 'templates/welcome.html',
    };

    try {
      // 1. Attempt to send the email
      await this.emailUtils.sendEmail(emailDetails);
      this.logger.log(`Successfully sent welcome email to ${data.email}`);

      // 2. If successful, log it to the database
      await this.prisma.notification.create({
        data: {
          recipient: data.email,
          subject: emailDetails.subject,
          status: 'SUCCESS',
          channel: 'EMAIL',
          content: emailDetails.body,
        },
      });
      this.logger.log(`Logged successful notification for ${data.email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${data.email}`,
        error.stack,
      );

      // 3. If it fails, log the failure to the database
      await this.prisma.notification.create({
        data: {
          recipient: data.email,
          subject: emailDetails.subject,
          status: 'FAILURE',
          channel: 'EMAIL',
          content: emailDetails.body,
          error: error.message, // Store the error message
        },
      });
      this.logger.error(`Logged FAILED notification for ${data.email}`);
    }
  }
}
