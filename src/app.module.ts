import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { TelegrafModule } from 'nestjs-telegraf';
import * as LocalSession from 'telegraf-session-local';

import { BotModule } from './bot/bot.module';
import { TicketsModule } from './tickets/tickets.module';

const sessions = new LocalSession({ database: 'session_db.json' });

@Module({
   imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        envFilePath: '.env',
      }),
      SequelizeModule.forRoot({
         dialect: 'postgres',
         host: 'localhost',
         port: 5432,
         username: 'postgres',
         password: '',
         database: 'support_chat_bot',
         autoLoadModels: true,
         logging: false,
         synchronize: true,
      }),
      TelegrafModule.forRoot({
         middlewares: [sessions.middleware()],
         token: process.env.TELEGRAM_TOKEN,
      }),
      BotModule,
      TicketsModule
   ],
   controllers: [],
   providers: [],
})
export class AppModule {}
