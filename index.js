require('dotenv').config();
const { Bot, GrammyError, HttpError, InlineKeyboard } = require('grammy');
const {hydrate} = require('@grammyjs/hydrate')
const bot = new Bot(process.env.BOT_TOKEN);
bot.use(hydrate());
bot.api.setMyCommands([
	{
		command: 'start',
		description: 'Запустить бота'
	},
	{
		command: 'menu',
		description: 'Меню'
	}
]);
// Создаем инлайн-клавиатуру для меню
const menuKeyboard = new InlineKeyboard()
	.text('Проверить подписку на канал', 'check_sub').row()
	.text('Создать приглашение', 'get_invite_link')

// Создаем инлайн-клавиатуру для выхода в главное меню
const backKeyboard = new InlineKeyboard().text('<- Назад в меню', 'back').row().url('Перейти в тг-канал', 'https://t.me/shuratest').row()
	
bot.command('start', async (ctx) => {
	let username = ctx.msg.from.username
	await ctx.reply(`Привет, ${username}\\! Я \\- бот тг\\-канала: [shuratest](https://t.me/shuratest)`, {
		parse_mode: 'MarkdownV2',
		reply_markup: menuKeyboard
	})
})

bot.command('menu', async (ctx) => {
	await ctx.reply('Выберите действие', {
		reply_markup: menuKeyboard
	})
})

bot.callbackQuery('check_sub', async (ctx) => {
	let id = ctx.msg.from.id;
	let pass = await bot.api.getChatMember('@shuratest', id);
	console.log(`ID пользака: ${id}, статус пользака: ${pass}`);
	if (pass.status == 'left') {
		await ctx.api.editMessageText(
			ctx.chat.id,
			ctx.update.callback_query.message.message_id,
			'Вы не подписаны на канал',
			{
				reply_markup: backKeyboard
			}
		)
		await ctx.answerCallbackQuery()
	} else {
		await ctx.api.editMessageText(
			ctx.chat.id,
			ctx.update.callback_query.message.message_id,
			`Проверка успешно пройдена!`,
			{
				reply_markup: backKeyboard
			}
		)
		await ctx.answerCallbackQuery()
	}
})

bot.callbackQuery('get_invite_link', async (ctx) => {
	await ctx.callbackQuery.message.editText('Создается ссылка', {
		reply_markup: backKeyboard
	})
	await ctx.answerCallbackQuery();
})

bot.callbackQuery('back', async (ctx) => {
	await ctx.callbackQuery.message.editText('Выберите действие', {
		reply_markup: menuKeyboard
	})
	await ctx.answerCallbackQuery();
})


// bot.callbackQuery('check_sub', async (ctx) => { 
// 	let id = ctx.msg.from.id;
// 	let pass = await bot.api.getChatMember('@shuratest', id);
// 	if (pass.status == 'left') {
// 		await ctx.reply('Ты еще не подписан на канал: [перейти в тг-канал](https://t.me/shuratest)')
// 		console.log('first');
// 	} else {
// 		await ctx.reply('Проверка пройдена!', {
// 				reply_markup: backKeyboard
// 			})
// 		}
// })

// bot.callbackQuery('back', async (ctx) => {
// 	await ctx.reply('Выберите действие', {
// 		reply_markup: inlineKeyboard
// 	}

// 	)
// })
// bot.on('callback_query:data', async (ctx) => {
// 	if (ctx.callbackQuery.data == 'check_sub') {
// 		let id = ctx.msg.from.id;
// 		let pass = await bot.api.getChatMember('@shuratest', id);
// 		if (pass.status == 'left') {
// 			await ctx.callbackQuery.message.editText('Ты еще не подписан на канал: [перейти в тг-канал](https://t.me/shuratest)', {
// 				reply_markup: backKeyboard
// 			})
// 			// await ctx.answerCallbackQuery()
// 			// await ctx.reply(`Ты еще не подписан на канал: [перейти в тг-канал](https://t.me/shuratest)`, {
// 			// 	parse_mode: 'MarkdownV2',
// 			// 	disable_web_page_preview: true
// 			// })
// 		} else {
// 			await ctx.callbackQuery.message.editText('Прооверка пройдена!')
// 			// await ctx.answerCallbackQuery()
// 			// await ctx.reply(`Проверка пройдена!`)
// 		}
// 	} else if (ctx.callbackQuery.data == 'get_invite_link') {
// 		await ctx.reply('Пример ссылки: google.com')
// 	}	
// })

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
