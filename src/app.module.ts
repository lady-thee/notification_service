/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationService } from './notification/notification.service';
import { NotificationController } from './notification/notification.controller';
import { PrismaService } from './prisma/prisma.service';
import { EmailUtils } from './utils/email.utils';
// import { PrismaController } from './prisma/prisma.controller';
// import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [AppController, NotificationController],
  providers: [AppService, NotificationService, PrismaService, EmailUtils],
  exports: [PrismaService],
})
export class AppModule {}
