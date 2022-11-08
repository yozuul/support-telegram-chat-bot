import { BelongsToMany, Column, DataType, HasMany, Model, Table } from "sequelize-typescript";
import { Ticket } from './ticket.model';

const { BIGINT, INTEGER, STRING, BOOLEAN } = DataType

interface ChannelCreationAttrs {
   chatId: bigint | number,
   chatType: string
}

@Table({ tableName: 'channels' })
export class Channel extends Model<Channel, ChannelCreationAttrs> {
   @Column({
      type: INTEGER,
      unique: true, autoIncrement: true, primaryKey: true
   }) id: number

   @Column({
      type: BIGINT, unique: true, allowNull: false
   }) chatId: bigint

   @Column({
      type: STRING, allowNull: false
   }) chatType: string

   // @HasMany(() => Ticket)
   // tickets: Ticket[]
}