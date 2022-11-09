export class CreateTicketDto {
   readonly threadId: bigint | number
   readonly senderId: bigint | number
   readonly userFirstName: string
   readonly userLastName: string
   readonly startedText: string
   readonly startedPostType: string
}