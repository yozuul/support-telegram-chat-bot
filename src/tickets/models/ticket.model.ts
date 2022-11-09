import { BelongsToMany, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import { Channel } from './channel.model';

const { BIGINT, INTEGER, STRING, BOOLEAN, TEXT } = DataType

interface TicketCreationAttrs {
   threadId: bigint
   senderId: bigint
   userFirstName: string
   userLastName: string
   startedText: string
   startedPostType: string
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
   }) threadId: bigint

   @Column({
      type: STRING, allowNull: true
   }) userFirstName: string

   @Column({
      type: STRING, allowNull: true
   }) userLastName: string

   @Column({
      type: TEXT, allowNull: true
   }) startedText: string

   @Column({
      type: STRING, defaultValue: 'text'
   }) startedPostType: string

   @Column({
      type: STRING, defaultValue: 'text'
   }) startedCaption: string

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