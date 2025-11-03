import prisma from "@database";
import { Interaction } from "../interaction.type";

const TEXT = `
Команда /connect позволяет связать ваш аккаунт Telegram с аккаунтом Bluesky.

Использование:
- /connect <telegramId> <telegramUrl> <blueskyUsername> <blueskyPassword> <enabled?> <commentsEnabled?>

Параметры:
- <telegramId> - Ваш уникальный идентификатор канала Telegram.
- <telegramUrl> - Ссылка на ваш канал Telegram.
- <blueskyUsername> - Ваше имя пользователя Bluesky.
- <blueskyPassword> - Ваш пароль Bluesky.
- <enabled?> - (необязательно: true) Включить или отключить публикацию обновлений (true/false).
- <commentsEnabled?> - (необязательно: true) Включить или отключить комментарии к публикациям (true/false).

telegramUrl является необязательным, и в качестве его можете указать null, если не хотите его использовать.

Пример:
- /connect -123456789 https://t.me/mychannel myblueskyuser myblueskypassword

После выполнения этой команды, ваш аккаунт Telegram будет связан с вашим аккаунтом Bluesky, что позволит вам публиковать обновления напрямую из Telegram в Bluesky.
    
Важно:
Пароль Bluesky не от Вашего аккаунта, он от приложения, которое Вы создали в Bluesky для интеграции с Telegram. Пожалуйста, убедитесь, что вы используете правильные учетные данные для успешного подключения.
`;

export const connectCommand = async (interaction: Interaction) => {
  if (interaction.message.chat.type !== "private") {
    return interaction.reply(
      "Эта команда доступна только в личных сообщениях."
    );
  }

  const text = interaction.text;
  if (!text) {
    return interaction.reply(TEXT);
  }

  const [_, telegramId, telegramUrl, blueskyUsername, blueskyPassword, enabled, commentsEnabled] =
    text.split(" ");

  if (!telegramId || !telegramUrl || !blueskyUsername || !blueskyPassword) {
    return interaction.reply(TEXT);
  }

  const prismaChannel = await prisma.channel.create({
    data: {
      id: telegramId,
      url: telegramUrl === "null" ? null : telegramUrl,
      blueskyId: blueskyUsername,
      blueskyPassword: blueskyPassword,
      enabled: enabled ? enabled === "true" : true,
      commentsEnabled: commentsEnabled ? commentsEnabled === "true" : true,
    },
  });

  /*
    НЕ ЗАБЫТЬ ДОБАВИТЬ ВАЛИДАЦИЮ ПАРОЛЯ И СУЩЕСТВОВАНИЯ АККАУНТА BLUESKY
  */

  if (!prismaChannel) {
    return interaction.reply("Не удалось подключить канал. Попробуйте еще раз.");
  }

  return interaction.reply("Канал успешно подключен к Bluesky!");
};

export default connectCommand;
