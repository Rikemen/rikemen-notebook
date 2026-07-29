import en from "./en";
import ja from "./ja";

const messages = {
  en,
  ja,
};
const config = {
  legacy: false,
  locale: "ja",
  messages,
};

export const languages = Object.keys(messages);

export default config;
