import { GetPassword } from "./database";

export async function CheckPassword(password: string): Promise<Boolean> {
  let correctPassword = await GetPassword();

  return password == correctPassword;
}
