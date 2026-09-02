export type CommunicationChannel="sms"|"email";
export type CommunicationPurpose="transactional"|"marketing";

export type SendMessage={
  to:string;
  subject?:string;
  text:string;
  html?:string;
  idempotencyKey:string;
  unsubscribeUrl?:string;
};

export type SendResult={providerKey:string;providerMessageId:string;status:"accepted"|"sent"};

export interface SmsProvider{readonly key:string;send(message:SendMessage):Promise<SendResult>}
export interface EmailProvider{readonly key:string;send(message:SendMessage):Promise<SendResult>}

export type CommunicationPolicy={
  timezone:string;
  allowedStartLocal:string;
  allowedEndLocal:string;
  allowedWeekdays:number[];
  maxSmsPer24h:number;
  maxEmailPer24h:number;
};
