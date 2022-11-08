import { Injectable } from '@nestjs/common';
import { InjectModel } from "@nestjs/sequelize";
import { Op } from 'sequelize';

import { Ticket } from './models/ticket.model';
import { Channel } from './models/channel.model';

@Injectable()
export class TicketsService {
   constructor(
      @InjectModel(Ticket)
      private ticketModel: typeof Ticket,
      @InjectModel(Channel)
      private channelModel: typeof Channel
   ) {}

   async updateTicketData({ senderId, ticketChatId }) {
      const openedTicket = await this.ticketModel.findOne({
         where: {
            [Op.and]: [
              { senderId: senderId },
              { closed: false },
              { ticketChatId: null },
            ]
         }
      })
      if(!openedTicket.ticketChatId) {
         openedTicket.ticketChatId = ticketChatId
         await openedTicket.save()
      }
      return openedTicket
   }

   async findBySenderId(senderId) {
      return this.ticketModel.findOne({
         where: { senderId: senderId }
      })
   }

   async findByChatId(charId) {
      return this.ticketModel.findOne({
         where: { ticketChatId: charId }
      })
   }

   async checkOpened(senderId) {
      return this.ticketModel.findOne({
         where: {
            [Op.and]: [
              { senderId: senderId },
              { closed: false }
            ]
         }
      })
   }

   async create(senderId, ticketChatId) {
      return this.ticketModel.create({
         senderId: senderId, ticketChatId: ticketChatId
      })
   }
   async deleteByThread(ticketChatId) {
      return this.ticketModel.destroy({
         where: { ticketChatId: ticketChatId }
      })
   }

   async getChannelId() {
      return this.channelModel.findOne({
         where: { chatType: 'channel' },
      })
   }
   async getGroupId() {
      return this.channelModel.findOne({
         where: { chatType: 'supergroup' },
      })
   }

   async checkAndAddChannel(chatId, chatType) {
      const current = await this.getAllChannels()
      if(current.length === 0) {
         return this.addChannel(chatId, chatType)
      }
      if(current.length === 1) {
         if(current[0].chatType === chatType) {
            return {
               error: 'channel_type', message: 'Вы пытаетесь добавить чат такого же типа что уже добавлен. Для функционирования бота, необходимо добавить его в КАНАЛ и ГРУППУ, привязанную к этому каналу (супергруппу)'
            }
         }
         return this.addChannel(chatId, chatType)
      }
      if(current.length === 2) {
         return {
            error: 'channe_limit', message: 'Бот уже добавлен в канал и группу. Пожалуйста, исключите бота из активных каналов, чтобы добавить к новому'
         }
      }
   }

   async addChannel(chatId, chatType) {
      try {
         const added = await this.channelModel.create({
            chatId: chatId, chatType: chatType
         })
         return {
            error: false, message: added
         }
      } catch (error) {
         console.log(error)
         throw new Error('Невозможно добавить канал')
      }
   }

   async deleteChannel(chatId, chatType) {
      try {
         console.log('УДАЛЯЕМ')
         return this.channelModel.destroy({
            where: { chatId: chatId }
         })
      } catch (error) {
         console.log(error)
         throw new Error('Невозможно удалить канал')
      }
   }

   async getAllChannels() {
      return this.channelModel.findAll()
   }
}
