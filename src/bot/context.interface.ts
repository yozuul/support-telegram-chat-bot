import { Context as ContextTelegraf } from 'telegraf';

export interface Context extends ContextTelegraf {
   session: {
      path?: 'home' | 'docs' | 'tickets',
      ticketStatus?: 'waitQuestion' | 'justCreate' | 'create' | 'waitOperator' | 'waitAnswer',
      ticketChat?: 'waitOperator' | 'waitAnswer',
      currentTicketId?: number
   };
}
