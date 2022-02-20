import { TryPassword, database } from "./database";
import { isLoggedIn } from "./stores";

const characters =
  "QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm123456789";

let loggedIn = false;
let loggingIn = false;

export async function Login(key: string) {
  if (!loggedIn && !loggingIn) {
    loggingIn = true;
    if (await CheckPassword(key)) {
      isLoggedIn.set(true);
      window.localStorage.setItem("pass", key);
      loggedIn = true;
    }
    loggingIn = false;
  }
}

export async function CheckPassword(password: string): Promise<Boolean> {
  return await TryPassword(password);
}

export async function ChangePassword(password: string): Promise<string> {
  let newPassword = "";
  for (let i = 0; i < 8; i++) {
    newPassword +=
      characters[Math.round(Math.random() * characters.length) - 1];
  }

  await Login(password);
  if (loggedIn) {
    database.setPassword(newPassword);
    return newPassword;
  } else {
    alert("Failed to save set password");
    throw Error("Failed to save set password");
  }
}
