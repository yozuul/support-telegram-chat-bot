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

   async linkThreadByUserId(senderId, messageId) {
      const notLinkedTicket = await this.ticketModel.findOne({
         where: {
            [Op.and]: [
              { senderId: senderId },
              { closed: false },
              { threadId: null },
            ]
         }
      })
      if(notLinkedTicket) {
         notLinkedTicket.threadId = messageId
         await notLinkedTicket.save()
      }
      return notLinkedTicket
   }
   async linkThreadByPostText(postType, messageText, captionText, senderName, messageId) {
      console.log(postType, messageText, captionText, senderName, messageId)
      const notLinkedTicket = await this.ticketModel.findOne({
         where: {
            [Op.and]: [
              { startedPostType: postType },
              { startedText: messageText },
              { closed: false },
              { threadId: null },
            ]
         }
      })
      console.log('notLinkedTicket', notLinkedTicket?.dataValues)
      if(notLinkedTicket) {
         if((notLinkedTicket.startedText === messageText) &&
            (notLinkedTicket.startedPostType === postType) &&
            (notLinkedTicket.startedCaption === captionText)) {
               notLinkedTicket.threadId = messageId
               await notLinkedTicket.save()
         }
      }
      return notLinkedTicket
   }

   async findBySenderId(senderId) {
      return this.ticketModel.findOne({
         where: { senderId: senderId }
      })
   }

   async findByThreadId(threadId) {
      return this.ticketModel.findOne({
         where: { threadId: threadId }
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

   async create(data) {
      return this.ticketModel.create(data)
   }

   async deleteByThread(threadId) {
      return this.ticketModel.destroy({
         where: { threadId: threadId }
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

   async deleteChannel(chatId) {
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
