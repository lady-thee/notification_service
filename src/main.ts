import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

const logger = new Logger();

async function bootstrap() {
  console.log('Starting Notification microservice...');
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.RMQ,
      options: {
        urls: [process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672'],
        queue: 'notification_queue',
        queueOptions: {
          durable: false,
        },
      },
    },
  );
  await app.listen();
  console.log(
    'Notification microservice is listening on the "notification_queue"',
  );
  logger.log('Notification service is listening on the "notification_queue"');
}
void bootstrap();
