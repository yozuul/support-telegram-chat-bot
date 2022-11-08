import { Module } from '@nestjs/common';

import { BotController } from './bot.controller';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { TicketsModule } from 'src/tickets/tickets.module';

@Module({
   providers: [BotService, BotUpdate],
   controllers: [BotController],
   imports: [TicketsModule]
})
export class BotModule {}
