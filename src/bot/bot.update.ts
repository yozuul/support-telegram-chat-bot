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

   @Hears('📝 Справочные материалы')
   async helpDocs(ctx: Context) {
      const text1 = `📁`
      const text2 = `Ответы на самые популярные вопросы вы можете найти на нашем сайте: https://www.google.com/\nТакже, большое количество полезной информации смотрите на нашем канале: https://www.youtube.com/`
      await ctx.reply(text1)
      await ctx.reply(text2)
      ctx.session.path = 'docs'
   }

   @Hears('💬 Написать в поддержку')
   async support(ctx: Context) {
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
      ctx.session.path = 'tickets';
   }

   @Hears('👈 Покинуть чат')
   async учше(ctx: Context) {
      await this.defaultMenuKeyboard(ctx);
      ctx.session.path = 'home';
   }

   @On('text')
   async getMessage(@Message('text') text: string, @Ctx() ctx: Context) {
      const message = ctx.update['message']
      console.log('message.sender_chat', message, '\n----------')
      // message.sender_chat - если сообщение из канала или группы
      if(message.sender_chat) {
         if(message.chat.type === 'supergroup') { // Если чат - это группа
            // Берём поле thread, отправителя, от кого было переслано сообщение чатом, и обновляем, если ещё не обновлено
            if(message?.forward_from?.id) {
               const openedTicket = await this.ticketService.updateTicketData({
                  senderId: message.forward_from.id, ticketChatId: message.message_id
               })
               console.log(openedTicket)
            }
            return
         }
      }
      // message_thread_id - если ответили комментом в группе
      if(message.message_thread_id) {
         this.botService.checkReplyTicket(ctx, this.bot)
         return
      }
      if((ctx.session.path === 'home') || !ctx.session.path) {
         await this.defaultMenuKeyboard(ctx);
         return
      }
      if(ctx.session.path === 'docs') {
         const text = 'Не нашли что искали?\nНапишите в службу поддержки, и мы обязательно вам поможем!'
         await this.mainMenuKeyboard(ctx, text);
         return
      }

      if(ctx.session.path === 'tickets') {
         await this.botService.createUpdateTicket(ctx, this.bot)
         if(!ctx.session.ticketStatus || (ctx.session.ticketStatus === 'waitQuestion')) {
            const text = 'Подключаем оператора к чату. Пожалуйста, дождитесь ответа'
            ctx.session.ticketStatus = 'create'
         }
         // await this.leaveChatKeyboard(ctx, text)
      }
   }

   @Start()
   async startCommand(ctx: Context) {
      ctx.session.path = 'home'
      await ctx.reply('🤖 Добро пожаловать в службу поддержки.\nЕсли у вас возникли вопросы, вы можете найти ответ на большинство из них в разделе  "Справочные материалы".\nЛибо напишите в службу поддержки.', actionButtons())
      return
   }

   // При добавлении / удалении бота в канал или группу
   @On('my_chat_member')
   async my_chat_member(@Ctx() ctx: Context) {
      this.botService.checkChannelStatus(ctx, this.bot)
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



// @On('chat_member')
// async chat_member(@Ctx() ctx: Context) {
//    const botId = ctx.botInfo.id
//    console.log(botId)
//    console.log('chat_member')
// }

   // @On('channel_post')
   // async mssage(@Ctx() ctx: Context) {
   //    console.log(ctx)
   // }
   // @On('callback_query')
   // async callback_query(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('callback_query')
   // }
   // @On('channel_chat_created')
   // async channel_chat_created(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('channel_chat_created')
   // }
   // @On('migrate_from_chat_id')
   // async migrate_from_chat_id(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('migrate_from_chat_id')
   // }
   // @On('migrate_to_chat_id')
   // async migrate_to_chat_id(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('migrate_to_chat_id')
   // }
   // @On('new_chat_members')
   // async new_chat_members(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('new_chat_members')
   // }
   // @On('supergroup_chat_created')
   // async supergroup_chat_created(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('supergroup_chat_created')
   // }
   // @On('group_chat_created')
   // async group_chat_created(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('group_chat_created')
   // }
   // @On('invoice')
   // async invoice(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('invoice')
   // }
   // @On('left_chat_member')
   // async left_chat_member(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('left_chat_member')
   // }
   // @On('chosen_inline_result')
   // async chosen_inline_result(@Ctx() ctx: Context) {
   //    console.log(ctx)
   //    console.log('chosen_inline_result')
   // }
   // @On('text')
   // async getMessage22(@Message('text') text: string, @Ctx() ctx: Context) {
      // await ctx.reply('🤖 Чем я могу вам помочь? ', actionButtons());
      // console.log(text)
      // console.log(ctx)
      // console.log(ctx.session.type)
      // if (!ctx.session.type) return;
//
//     if (ctx.session.type === 'create') {
//       const tasks = await this.appService.createTask(message);
//       await ctx.reply(showList(tasks));
//     }
//
//     if (ctx.session.type === 'done') {
//       const tasks = await this.appService.doneTask(Number(message));
//       if (!tasks) {
//         await ctx.reply('Я не нашел такой задачи чтобы завершить 😕');
//         return;
//       }
//       await ctx.reply(showList(tasks));
//     }
//
//     if (ctx.session.type === 'delete') {
//       const tasks = await this.appService.deleteTask(Number(message));
//       if (!tasks) {
//         await ctx.reply('Я не нашел такой задачи чтобы удалить 😕');
//         return;
//       }
//       await ctx.reply(showList(tasks));
//     }
   // }