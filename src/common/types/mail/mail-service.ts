export enum MailTemplate {
  verification = 'verification',
  boardInvitation = 'boardInvitation',
}

export type MailContexts = {
  [MailTemplate.verification]: {
    code: string;
  };
  [MailTemplate.boardInvitation]: {
    inviterName: string;
    boardName: string;
    link: string;
  };
};
