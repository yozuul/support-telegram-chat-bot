import { Injectable } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';

@Injectable()
export class BotService {
   constructor(
      private readonly ticketService: TicketsService,
   ) {}

   // Проверяем, есть ли открытый тиккет для данного пользователя
   async checkOpenedTicket(message, bot) {
      const openTicket = await this.ticketService.checkOpened(message.from.id)
      const chat = await this.ticketService.getChannelId()
      console.log('checkOpenedTicket', openTicket)
      if(!openTicket) {
         // Сначала создаём запись о тиккете без ветки
         await this.ticketService.create({
            senderId: message.from.id,
            userFirstName: message.from.first_name,
            userLastName: message.from.last_name,
            startedText: message.text || null,
            startedPostType: message.document ? 'doc' : 'text',
            startedCaption: message.caption || null,
            threadId: null
         })
         try {
            console.log('chat', chat)
            console.log('chat', chat)
            console.log('chat', chat)
            // Потом постим запись в канал, перехватываем ID ветки, и обновляем запись
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
      const message = ctx.update['my_chat_member']
      const status = message.new_chat_member.status
      const chat = message.chat
      // Добавил / удалил пользователь. Не делаем ничего
      if(chat.type === 'private') {
         console.log(message.from, 'Пользователь подключился к боту')
         return
      }

      if(chat.type === 'channel') {
         console.log('STATUS', status)
         if(status === 'administrator') {
            const existChannel = await this.ticketService.getChannelId()
            if(existChannel) {
               await ctx.leaveChat(chat.id)
            } else {
               await this.ticketService.addChannel(chat.id, chat.type)
            }
         }
         if(status === 'kicked') {
            await this.ticketService.deleteChannel(chat.id)
         }
         return
      }

      if(chat.type === 'supergroup') {
         if(status === 'member') {
            const existGroup = await this.ticketService.getGroupId()
            if(existGroup) {
               await ctx.leaveChat(chat.id)
            } else {
               await this.ticketService.addChannel(chat.id, chat.type)
            }
         }
         if(status === 'left') {
            await this.ticketService.deleteChannel(chat.id)
         }
         return
      }

      if(chat.type === 'group') {
         await ctx.leaveChat(chat.id)
         return
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