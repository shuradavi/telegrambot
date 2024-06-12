require('dotenv').config();
const { Bot, GrammyError, HttpError } = require('grammy');

const bot = new Bot(process.env.BOT_TOKEN);

bot.api.setMyCommands([
	{
		command: 'start',
		description: 'Запустить бота'
	},
	{
		command: 'check_sub',
		description: 'Проверить подписку на канал'
	},
	{
		command: 'get_link',
		description: 'Получить ссылку-приглашения'
	}
]);

bot.command('start', async (ctx) => {
	await ctx.reply('Welcome')
})

bot.command('check_sub', async (ctx) => {
	let id = ctx.msg.from.id;
	let username = ctx.msg.from.first_name;
	let pass = await bot.api.getChatMember('@shuratest', id);
	if (pass.status == 'left') {
		ctx.reply(`${username}, подпишись на канал`)
	} else {
		ctx.reply(`Спасибо что подписался на канал, ${username} !`)
	}
})

bot.command('get_link', async (ctx) => {
	ctx.reply('Пусто')
})

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;

	if (e instanceof GrammyError) {
		console.error("Error in request:", e.description);
	} else if (e instanceof HttpError) {
		console.error("Could not connect to Telegram", e);
	} else {
		console.error('Unknown error:', e);
	}
})
bot.start();
