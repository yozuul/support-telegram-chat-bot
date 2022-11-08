import { Markup } from 'telegraf';

export function actionButtons() {
  return Markup.keyboard([
      Markup.button.callback('📝 Справочные материалы', 'list'),
      Markup.button.callback('💬 Написать в поддержку', 'create'),
   ],
   { columns: 2 },
   ).resize();
}

export function leaveChatButton() {
  return Markup.keyboard([
      Markup.button.callback('👈 Покинуть чат', 'leaveChat'),
   ]
   ).resize();
}

export function closeTicketButton() {
  return Markup.inlineKeyboard([
     Markup.button.callback("Закрыть тиккет", "close"),
  ])
}
