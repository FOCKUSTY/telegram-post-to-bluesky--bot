import { Interaction } from "../interaction.type";

const TEXT = `Здравствуй, чтобы подключить Telegram к Bluesky, вам нужно будет:
1. Выдать нам имя пользователя Вашего аккаунта Bluesky.
2. Выдать нам токен доступа к Вашему аккаунту Bluesky.
3. Выдать нам id вашего канала Telegram (для этого можете переотправить нам сообщение из канала).
4. INDEV (необязательно) Выдать нам id группы Telegram канала (если Вы хотите отправлять комментарии в Bluesky).
4. Добавить бота в Ваш канал Telegram.
5. INDEV (необязательно) Добавить бота в группу Telegram канала (если Вы хотите отправлять комментарии в Bluesky).

Примечание: данные о постах и комментариях храняться в базе данных не более одной недели.`;

export const startCommand = (interaction: Interaction) => {
  return interaction.reply(TEXT);
};

export default startCommand;
