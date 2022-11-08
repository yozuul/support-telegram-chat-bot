import { Injectable } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class BotService {
   constructor(
      private readonly ticketService: TicketsService,
   ) {}

   // Проверяем, есть ли открытый тиккет для данного пользователя
   async checkOpenedTicket(message, bot) {
      const senderId = message.from.id
      const openTicket = await this.ticketService.checkOpened(senderId)
      const chat = await this.ticketService.getChannelId()
      if(!openTicket) {
         await this.ticketService.create(senderId, null)
         try {
            await bot.telegram.forwardMessage(
               chat.chatId, message.from.id, message.message_id
            )
         } catch (error) {
            console.log(error, 'Невозможно создать новый тиккет в канале')
         }
      }
      return openTicket
   }

   async checkChannelStatus(ctx, bot) {
      const query = ctx.update['my_chat_member']
      const botOwner = this.botOwner(query.from)
      const senderId = query.from.id         // ID отправителя запроса
      const chatId = query.chat.id          // ID чата (канала / группы)
      const chatType = query.chat.type       // Тип чата (канал / группа)
      const { status } = query.new_chat_member

      if(botOwner) { // Если уведомление пришло от владельца бота
         // Если бота заинвайтили, пробуем добавить
         if((status === 'administrator') || (status === 'member')) {
            if(chatType === 'group') { // Если не супергруппа
               console.log('Указанная группа не привязана к каналу, поэтому не может быть добавлена', query)
               await this.leaveChannel(ctx, chatId, chatType)
               const text = 'Указанная группа не привязана к каналу, поэтому не может быть добавлена'
               bot.telegram.sendMessage(senderId, text)
            }
            const added = await this.ticketService.checkAndAddChannel(chatId, chatType)
            // console.log('added', added)
            if(added?.error) {
               console.log('1111111111111', query)
               await this.leaveChannel(ctx, chatId, chatType)
               // bot.telegram.sendMessage(senderId, added.message)
            }
         }
         // Если бота кикнули, удаляем канал из БД
         if((status === 'left') || (status === 'kicked')) {
            const del = await this.ticketService.deleteChannel(chatId, chatType)
            console.log('del', del)
         }
      } else { // Если уведомление не от владельца бота или от др бота
         // Если инвайт, пробуем добавить
         if((status === 'administrator') || (status === 'member')) {
            const added = await this.ticketService.checkAndAddChannel(chatId, chatType)
            if(added?.error) {
               console.log('22222222222', query)
               await this.leaveChannel(ctx, chatId, chatType)
            }
         }
      }
   }

   async leaveChannel(ctx, chatId, chatType) {
      try {
         if(chatType !== 'private') {
            await ctx.leaveChat(chatId)
         }
      } catch (error) {
         console.log(error, 'нельзя покинуть группу')
      }
   }

   botOwner({ id, username }) {
      const ownerName = process.env.BOT_OWNER_NAME
      const ownerId = parseInt(process.env.BOT_OWNER_ID)
      if(ownerName.includes(username) || ownerId === id) {
         return {
            name: ownerName, id: ownerId
         }
      } else {
         return false
      }
   }
}