import { isEmail } from "@src/common/utils/validators";

export const signupSchema = { email: isEmail }