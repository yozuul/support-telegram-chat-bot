import { Injectable } from '@nestjs/common';
import { TicketsService } from '../tickets/tickets.service';
import {closeTicketButton} from './bot.buttons';

@Injectable()
export class BotService {
   constructor(
      private readonly ticketService: TicketsService,
   ) {}

   async checkReplyTicket(ctx, bot) {
      const message = ctx.update['message']
      const { chatId } = await this.ticketService.getGroupId()
      await bot.telegram.sendMessage(message.reply_to_message.forward_from.id, message.text)
      // console.log('message.forward_from', message.reply_to_message.forward_from.id)
      // const forwaredReply = await bot.telegram.forwardMessage(
      //    message.reply_to_message.forward_from.id, chatId, message.message_id
      // )
      // console.log(forwaredReply)
   }

   async createUpdateTicket(ctx, bot) {
      const message = ctx.update['message']
      const tg = bot.telegram
      const openTicket = await this.ticketService.checkOpened(message.from.id)
      const chat = await this.ticketService.getChannelId()
      const group = await this.ticketService.getGroupId()
      if(!openTicket) {
         // Указываем только ID пользователя, поскольку ID чата в группе узнаем только после того как там оставят коммент (ответят на тиккет)
         const newTicket = await this.ticketService.create(message.from.id, null)
         // Пересылаем сообщение в канал
         const forwaredQuestion = await bot.telegram.forwardMessage(
            chat.chatId, message.from.id, message.message_id
         )
      } else {
         try {
            await bot.telegram.sendMessage(group.chatId, message.text, {
               reply_to_message_id: openTicket.ticketChatId
            })
         } catch (error) {
            console.log('сообщение удалено')
            await this.ticketService.deleteByThread(openTicket.ticketChatId)
            this.createUpdateTicket(ctx, bot)
         }
      }
   }

   async checkChannelStatus(ctx, bot) {
      const query = ctx.update['my_chat_member']
      const botOwner = this.botOwner(query.from)
      const senderId = query.from.id         // ID отправителя запроса
      const chatlId = query.chat.id          // ID чата (канала / группы)
      const chatType = query.chat.type       // Тип чата (канал / группа)
      const { status } = query.new_chat_member

      if(botOwner) { // Если уведомление пришло от владельца бота
         // Если бота заинвайтили, пробуем добавить
         if((status === 'administrator') || (status === 'member')) {
            if(chatType === 'group') { // Если не супергруппа
               ctx.leaveChat(chatlId)
               const text = 'Указанная группа не привязана к каналу, поэтому не может быть добавлена'
               bot.telegram.sendMessage(senderId, text)
            }
            const added = await this.ticketService.checkAndAddChannel(chatlId, chatType)
            console.log('added', added)
            if(added?.error) {
               ctx.leaveChat(chatlId)
               bot.telegram.sendMessage(senderId, added.message)
            }
         }
         // Если бота кикнули, удаляем канал из БД
         if((status === 'left') || (status === 'kicked')) {
            const del = await this.ticketService.deleteChannel(chatlId, chatType)
            console.log('del', del)
         }
      } else { // Если уведомление не от владельца бота или от др бота
         // Если инвайт, пробуем добавить
         if((status === 'administrator') || (status === 'member')) {
            const added = await this.ticketService.checkAndAddChannel(chatlId, chatType)
            if(added?.error) {
               ctx.leaveChat(chatlId)
               return
            }
         }
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