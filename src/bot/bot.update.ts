import { Ctx, Hears, InjectBot, Message, On, Start, Update } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

import { actionButtons, leaveChatButton } from './bot.buttons';
import { BotService } from './bot.service';
import { Context } from './context.interface';
import { TicketsService } from '../tickets/tickets.service';

@Update()
export class BotUpdate {
   constructor(
      @InjectBot()
      private readonly bot: Telegraf<Context>,
      private readonly botService: BotService,
      private readonly ticketService: TicketsService,
   ) {}

   @Start()
   async startCommand(ctx: Context) {
      ctx.session.path = 'home'
      await ctx.reply('🤖', actionButtons())
      await ctx.reply('Добро пожаловать в службу поддержки.\nЕсли у вас возникли вопросы, вы можете найти ответ на большинство из них в разделе  "Справочные материалы".\nЛибо напишите в службу поддержки.', actionButtons())
      return
   }
   // При добавлении / удалении бота в канал или группу
   @On('my_chat_member')
   async my_chat_member(@Ctx() ctx: Context) {
      console.log(ctx.update['my_chat_member'])
      this.botService.checkChannelStatus(ctx, this.bot)
   }

   @Hears('📝 Справочные материалы')
   async helpDocs(ctx: Context) {
      ctx.session.path = 'docs'
      const text = `Ответы на самые популярные вопросы вы можете найти на нашем сайте: https://www.google.com/\nТакже, большое количество полезной информации смотрите на нашем канале: https://www.youtube.com/`
      await ctx.reply(`📁`)
      await ctx.reply(text)
   }

   @Hears('💬 Написать в поддержку')
   async support(ctx: Context) {
      ctx.session.path = 'tickets';
      if((ctx.session.ticketStatus === 'waitQuestion') || !ctx.session.ticketStatus) {
         await this.leaveChatKeyboard(ctx, '💬')
         const text = `Задайте свой вопрос.\nВам ответит первый освободившийся оператор.`
         await this.leaveChatKeyboard(ctx, text)
         ctx.session.ticketStatus = 'waitQuestion'
      }
      if(ctx.session.ticketStatus === 'create') {
         const text = 'Чат службы поддержки.'
         await this.leaveChatKeyboard(ctx, '💬')
         await this.leaveChatKeyboard(ctx, text)
      }
   }

   @Hears('👈 Покинуть чат')
   async учше(ctx: Context) {
      ctx.session.path = 'home';
      await this.defaultMenuKeyboard(ctx);
   }

   @On('message')
   async testMessage(@Message('text') text: string, @Ctx() ctx: Context) {
      const message = ctx.update['message']
      // Если ответили в комментах (оператор), или написали боту
      if(message.message_thread_id) {
         await this.threadMessage(ctx, message, text)
      } else {
         await this.botMessage(ctx, message, text)
      }
   }

   async threadMessage(ctx, message, text) {
      // console.log('threadMessage MESSAGE', message)
      // console.log('threadMessage text', text)
      console.log('сообщение в комментах')
      const threadId = message.message_thread_id
      const ticketExist = await this.ticketService.findByThreadId(threadId)
      if(ticketExist && !ticketExist.closed && ticketExist.ticketChatId === threadId.toString()) {
         console.log(ticketExist.senderId)
         await this.sendMessage(ticketExist.senderId, message, false)
      }
   }

   async botMessage(ctx, message, text) {
      console.log('botMessage MESSAGE', message)
      console.log('botMessage text', text)
      console.log('сообщение боту')
      if(message.sender_chat?.type === 'channel') {
         if(message.forward_from?.id) {
            await this.ticketService.updateTicketData(message.forward_from?.id, message.message_id)
         }
      }
      if(ctx.session.path === 'home') {
         await this.defaultMenuKeyboard(ctx);
      }
      if(ctx.session.path === 'docs') {
         const text = 'Не нашли что искали?\nНапишите в службу поддержки, и мы обязательно вам поможем!'
         await this.mainMenuKeyboard(ctx, text);
      }

      if(ctx.session.path === 'tickets') {
         const openTicket = await this.botService.checkOpenedTicket(message, this.bot)
         if(openTicket) {
            const { chatId } = await this.ticketService.getGroupId()
            try {
               await this.sendMessage(chatId, message, openTicket.ticketChatId)
            } catch (error) {
               if(error.message === 'reply_not_found') {
                  await this.ticketService.deleteByThread(openTicket.ticketChatId)
                  this.botMessage(ctx, message, text)
               }
            }
         }
         if(!ctx.session.ticketStatus || (ctx.session.ticketStatus === 'waitQuestion')) {
            const text = 'Подключаем оператора к чату. Пожалуйста, дождитесь ответа'
            await this.leaveChatKeyboard(ctx, text)
            ctx.session.ticketStatus = 'create'
         }
      }
   }

   async sendMessage(recipient, message, reply) {
      if(message.document) {
         try {
            await this.bot.telegram.sendDocument(recipient, message.document.file_id, {
               caption: message.caption || 'Вложение',
               reply_to_message_id: reply ? reply : '',
            })
         } catch (error) {
            console.log(error, 'Невозможно отправить документ', {
               recipient, message, reply
            })
            // Если тиккет был удалён с канала, а пользователь написал туда новое сообщение, бросаем ещё одну ошибку, чтобы пересоздать новый тиккет
            if(error.description.includes('replied message not found')) {
               throw new Error('reply_not_found')
            }
         }
      }
      if(!message.document) {
         try {
            await this.bot.telegram.sendMessage(recipient, message.text || 'Сообщение от пользователя', {
               reply_to_message_id: reply ? reply : '',
            })
         } catch (error) {
            console.log(error, 'Невозможно отправить сообщение', {
               recipient, message, reply
            })
            if(error.description.includes('replied message not found')) {
               throw new Error('reply_not_found')
            }
         }
      }
   }

   async defaultMenuKeyboard(ctx) {
      return ctx.reply('🤖 Чем я могу вам помочь?', actionButtons());
   }
   async mainMenuKeyboard(ctx, text) {
      return ctx.reply(text, actionButtons());
   }
   leaveChatKeyboard(ctx, text) {
      return ctx.reply(text, leaveChatButton());
   }
}