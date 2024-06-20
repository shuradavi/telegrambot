require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const {KeyboardButtonRequestUser} = require('grammy/types')
// const {hydrate} = require('@grammyjs/hydrate')
const bot = new Bot(process.env.BOT_TOKEN);
// bot.use(hydrate());
bot.api.setMyCommands([
	{
		command: 'start',
		description: 'Запустить бота'
	},
	{
		command: 'menu',
		description: 'Открыть меню'
	},
	{
		command: 'tickets',
		description: 'Билеты розыгрыша'
	}
]);
// Функция создания кнопки выбора пользователя
const createChooseUserBtn = (ctx) => {
	return (
		[[{
			text: 'К списку контактов',
			request_users: {
				request_id: ctx.message.from.id,
				request_username: true,
				user_is_bot: false
			}
		}]])
} 



// Создаем клавиатуру для меню
const menuLabels = ['Проверить подписку на канал', 'Проверить билеты'];
const onFailSub = ['Подписаться на канал', '<- Назад в меню'];
const menuRows = menuLabels.map((label) => {
	return [
		Keyboard.text(label)
	]
})
const onFailSubRows = onFailSub.map((label) => {
	return [
		Keyboard.text(label)
	]
})
const menuKeyboard = Keyboard.from(menuRows).resized().oneTime()
const shareUserKeyboard = new Keyboard().text('Пригласить друга').resized()
const onFailSubKeyboard = Keyboard.from(onFailSubRows).resized().oneTime()

bot.command('start', async (ctx) => {
	const username = ctx.msg.from.username
	await ctx.reply(`Привет, ${username}! Я - бот тг-канала: <a href="https://t.me/shuratest">Shura Test</a>`, {
		parse_mode: 'HTML',
		reply_markup: menuKeyboard,
	})
})

bot.command('Пригласить друга', async (ctx) => {
	await ctx.reply('Выбрать из списка контактов', {
		reply_markup: {
			keyboard: createChooseUserBtn(ctx),
			resize_keyboard: true,
			one_time_keyboard: true
		}
	})
})


bot.command('menu', (ctx) => {
		ctx.reply(`Выберите действие`, {
		parse_mode: 'HTML',
		reply_markup: menuKeyboard
	})
})

bot.command('tickets', async (ctx) => {
	ctx.reply('За каждого подписавшегося на канал друга, вы получаете билеты участия в розыгрыше. На данный момент у вас N билетов', {
		reply_markup: menuKeyboard
	})
})

bot.hears('Проверить билеты', async (ctx) => {
	ctx.reply('За каждого подписавшегося на канал друга, вы получаете билеты участия в розыгрыше. На данный момент у вас N билетов', {
		reply_markup: menuKeyboard
	})
})

bot.hears('Проверить подписку на канал', async (ctx) => {
	let id = ctx.msg.from.id;
	let username = ctx.msg.from.username;
	let pass = await bot.api.getChatMember('@shuratest', id);

	if (pass.status == 'left') {
		await ctx.reply('Вы не подписаны на канал',
			{
				reply_parameters: { message_id: ctx.msg.message_id },
				reply_markup: onFailSubKeyboard
			}
		)
	} else {
		await ctx.reply('Вы подписаны на канал, приглашайте друзей для участия в розыгрыше',
			{
				reply_parameters: { message_id: ctx.msg.message_id },
				reply_markup: shareUserKeyboard
			}
		)
	}
})

bot.hears('Пригласить друга', async (ctx) => {
	await ctx.reply('Выберите друга из списка контактов', {
		reply_markup: {
			keyboard: createChooseUserBtn(ctx),
			resize_keyboard: true,
			one_time_keyboard: true
		}
	})
})

bot.on(':users_shared', async (ctx) => {
	console.log(ctx.message.users_shared);
	let user = ctx.message.users_shared.users[0];
	let id = user.user_id;
	try {
		const pass = await bot.api.getChatMember('@shuratest', id);
	user.status = pass.status

	if (user.status == 'left') {
		await ctx.reply('Данные пользователя получены 👍')
		await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/+hA7XB2pUFmJlZDgy')
		await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
			reply_markup: {
				keyboard: createChooseUserBtn(ctx),
				resize_keyboard: true,
				one_time_keyboard: true
			}
		})
	} else if (user.status == 'kicked') {
		await ctx.reply(`Пользователь ${user.username} заблокирован за нарушение правил канала, попробуйте выбрать другого человка`, {
			reply_markup: {
				keyboard: createChooseUserBtn(ctx),
				resize_keyboard: true,
				one_time_keyboard: true
			}
		})
	} else await ctx.reply(`Пользователь ${user.username} уже подписан на канал, попробуйте выбрать другого человка`, {
				reply_markup: {
					keyboard: createChooseUserBtn(ctx),
					resize_keyboard: true,
					one_time_keyboard: true
			}
			})
	} catch (error) {
		await ctx.reply('Данные пользователя получены 👍')
		await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/+hA7XB2pUFmJlZDgy')
		await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
			reply_markup: {
				keyboard: createChooseUserBtn(ctx),
				resize_keyboard: true,
				one_time_keyboard: true
			}
		})
	}
	})
	
bot.hears('<- Назад в меню', async (ctx) => {
	await ctx.reply('Выберите действие',
		{
			reply_markup: menuKeyboard
		}
	)
})

bot.hears('Перейти в тг-канал', async (ctx) => {
	await ctx.reply(`[Shura Test Channel](https://t.me/shuratest)`,
		{
			parse_mode: 'MarkdownV2',
			disable_web_page_preview: true
		})
})

bot.hears('Подписаться на канал', (ctx) => {
	ctx.reply('Перейдите в тг канал, подпишитесь и возвращайтесь ко мне: <a href="https://t.me/shuratest">Shura Test</a>', {
		parse_mode: 'HTML',
	})
})

bot.catch((err) => {
	const ctx = err.ctx;
	console.error(`Error while handling update ${ctx.update.update_id}:`);
	const e = err.error;

	if (e instanceof GrammyError) {
		console.error("Error in request:", e);
	} else if (e instanceof HttpError) {
		console.error("Could not connect to Telegram", e);
	} else {
		console.error('Unknown error:', e);
	}
})
bot.start();
