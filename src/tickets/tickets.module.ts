import { Module } from '@nestjs/common';
import { SequelizeModule } from "@nestjs/sequelize";

import { Ticket } from './models/ticket.model';
import { Channel } from './models/channel.model';

import { TicketsService } from './tickets.service';

@Module({
  imports: [
     SequelizeModule.forFeature([Ticket, Channel])
  ],
  providers: [TicketsService],
  exports: [TicketsService]
})
export class TicketsModule {}