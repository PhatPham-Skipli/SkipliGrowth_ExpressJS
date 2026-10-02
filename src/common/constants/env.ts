import jetEnv, { bool, num, str } from 'jet-env';
import tspo from 'tspo';

/******************************************************************************
                                 Constants
******************************************************************************/

// NOTE: These need to match the names of your ".env" files
export const NodeEnvs = {
  DEV: 'development',
  TEST: 'test',
  PRODUCTION: 'production',
} as const;

/******************************************************************************
                                 Setup
******************************************************************************/

const optStr = (v: unknown, cb?: (tval: unknown) => void): boolean => {
  if (cb && typeof v !== 'string') {
    cb('');
  }
  return true;
};

const EnvVars = jetEnv({
  NodeEnv: (v) => tspo.isValue(NodeEnvs, v),
  Port: num,
  GoogleApplicationCredentials: str,
  FirebaseLocation: str,
  FirebaseProjectId: str,
  FirebaseApiKey: str,
  FirebasePrivateKey: optStr,
  FirebaseClientEmail: optStr,
  FrontendUrl: str,
  Mail: {
    MailHost: str,
    MailPort: num,
    MailSecure: bool,
    MailUser: str,
    MailPass: str,
    MailFromName: str,
    MailFromAddress: str,
  },
  Jwt: {
    Secret: str,
    Exp: str,
  },
  GithubClientId: str,
  GithubClientSecret: str,
  GithubRedirectUri: str,
  Stripe: {
    SecretKey: optStr,
    WebhookSecret: optStr,
  },
});

/******************************************************************************
                            Export default
******************************************************************************/

export default EnvVars;
