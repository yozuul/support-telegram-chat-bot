import { BelongsToMany, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Channel } from './channel.model';

const { BIGINT, INTEGER, STRING, BOOLEAN } = DataType

interface TicketCreationAttrs {
   ticketChatId: bigint
   senderId: bigint
   status: string
}

@Table({ tableName: 'tickets' })
export class Ticket extends Model<Ticket, TicketCreationAttrs> {
   @Column({
      type: INTEGER,
      unique: true, autoIncrement: true, primaryKey: true
   }) id: number

   @Column({
      type: BIGINT, allowNull: false
   }) senderId: bigint

   @Column({
      type: BIGINT, unique: true, allowNull: true
   }) ticketChatId: bigint

   @Column({
      type: STRING, defaultValue: 'open'
   }) status: string

   @Column({
      type: BOOLEAN, defaultValue: false
   }) closed: boolean

   // @ForeignKey(() => Channel)
   // @Column({
   //    type: INTEGER
   // }) channelId
}