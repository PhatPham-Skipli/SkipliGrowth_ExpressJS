import nodemailer from 'nodemailer';
import hbs, {
  NodemailerExpressHandlebarsOptions,
} from 'nodemailer-express-handlebars';
import path from 'path';

import EnvVars from '@src/common/constants/env';
import {
  MailContexts,
  MailTemplate,
} from '@src/common/types/mail/mail-service';

/******************************************************************************
                                Setup
******************************************************************************/

// Configure transporter using your SMTP credentials (e.g. from environment variables)
const transporter = nodemailer.createTransport({
  host: EnvVars.Mail.MailHost,
  port: EnvVars.Mail.MailPort,
  secure: EnvVars.Mail.MailSecure,
  auth: {
    user: EnvVars.Mail.MailUser,
    pass: EnvVars.Mail.MailPass,
  },
});

// ==== Configure Handlebars ====
const hbsOptions: NodemailerExpressHandlebarsOptions = {
  viewEngine: {
    extname: '.hbs',
    partialsDir: path.resolve(__dirname, '../views/emails/'),
    layoutsDir: path.resolve(__dirname, '../views/emails/'),
    defaultLayout: false, // Set a default layout if you have one
  },
  viewPath: path.resolve(__dirname, '../views/emails/'),
  extName: '.hbs',
};
transporter.use('compile', hbs(hbsOptions));

/******************************************************************************
                                Functions
******************************************************************************/

/**
 * Send a verification code to the user's email.
 */
async function sendEmail<T extends MailTemplate>({
  to,
  subject,
  template,
  context,
}: {
  to: string;
  subject?: string;
  template: T;
  context: MailContexts[T];
}): Promise<void> {
  // Setup mail options
  const mailOptions = {
    from: EnvVars.Mail.MailFromAddress,
    to,
    subject: subject || 'Mini Trello - Notification',
    template, // Name of the hbs file without extension
    context,
  };

  // Send email
  await transporter.sendMail(mailOptions);
}

async function sendVerificationEmail({
  to,
  code,
}: {
  to: string;
  code: string;
}) {
  await sendEmail({
    to,
    subject: 'Mini Trello - Verification Code',
    template: MailTemplate.verification,
    context: {
      code,
    },
  });
}

async function sendBoardInvitationEmail({
  to,
  inviterName,
  boardName,
  link,
}: {
  to: string;
  inviterName: string;
  boardName: string;
  link: string;
}) {
  await sendEmail({
    to,
    subject: `Mini Trello - ${inviterName} invited you to the board "${boardName}"`,
    template: MailTemplate.boardInvitation,
    context: {
      inviterName,
      boardName,
      link,
    },
  });
}

/******************************************************************************
                                Export default
******************************************************************************/

export default {
  sendVerificationEmail,
  sendBoardInvitationEmail,
} as const;
