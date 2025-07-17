import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
  // Injecting  the main service
  constructor(private readonly notificationService: NotificationService) {}

  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: { email: string; name: string }) {
    // the work to the service
    await this.notificationService.sendWelcomeEmailAndLog(data);
  }
}
