import { Interaction } from "../interaction.type";

const TEXT = `
Команда /connect позволяет связать ваш аккаунт Telegram с аккаунтом Bluesky.

Использование:
- /connect <telegramId> <telegramUrl> <blueskyUsername> <blueskyPassword>

Параметры:
- <telegramId> - Ваш уникальный идентификатор канала Telegram.
- <telegramUrl> - Ссылка на ваш канал Telegram.
- <blueskyUsername> - Ваше имя пользователя Bluesky.
- <blueskyPassword> - Ваш пароль Bluesky.

telegramUrl является необязательным, и в качестве его можете указать null, если не хотите его использовать.

Пример:
- /connect -123456789 https://t.me/mychannel myblueskyuser myblueskypassword

После выполнения этой команды, ваш аккаунт Telegram будет связан с вашим аккаунтом Bluesky, что позволит вам публиковать обновления напрямую из Telegram в Bluesky.
    
Важно:
Пароль Bluesky не от Вашего аккаунта, он от приложения, которое Вы создали в Bluesky для интеграции с Telegram. Пожалуйста, убедитесь, что вы используете правильные учетные данные для успешного подключения.
`;

export const connectCommand = (interaction: Interaction) => {
  if (interaction.message.chat.type !== "private") {
    return interaction.reply("Эта команда доступна только в личных сообщениях.");
  }

  const text = interaction.text;

  if (!text) {
    return interaction.reply(TEXT);
  };

  const [
    _,
    telegramId,
    telegramUrl,
    blueskyUsername,
    blueskyPassword
  ] = text.split(" ");

  if (!telegramId || !telegramUrl || !blueskyUsername || !blueskyPassword) {
    return interaction.reply(TEXT);
  };

  return interaction.reply("Подклчючение к Bluesky в разработке.");
};

export default connectCommand;
