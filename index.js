import 'dotenv/config'
import { LowSync, Low } from 'lowdb'
import { JSONFileSync, JSONFilePreset } from 'lowdb/node'
import { Bot, GrammyError,HttpError, Keyboard } from "grammy";
const bot = new Bot(process.env.BOT_TOKEN);
const db = new LowSync(new JSONFileSync('users.json'), { "users": {} })
// const cl = new LowSync(new JSONFileSync('contestList.json'), { "list": {} })
const cl = await JSONFilePreset(('contestList.json'), { "users": {}})
const createChooseUserBtn = (ctx) => {
	return (
		[
			[
				{
					text: 'К списку контактов',
					request_users: {
						request_id: ctx.message.from.id,
						request_username: true,
						user_is_bot: false
					}
				}
			],
			[
				{
					text: 'Проверить билеты'
				}
			],
			[
				{
					text: '<- Назад в меню'
				}
			]
			
		])
}
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
const shareUserKeyboard = new Keyboard().text('Пригласить друга').row().text('Проверить билеты').row().text('<- Назад в меню').resized()
const onFailSubKeyboard = Keyboard.from(onFailSubRows).resized().oneTime()

bot.command('start', async (ctx) => {
	if (ctx.from.is_bot === false) {
		const username = ctx.msg.from.username
		await ctx.reply(`Привет, ${username}! Я - бот тг-канала: <a href="https://t.me/shuratest">Shura Test</a>`, {
			parse_mode: 'HTML',
			reply_markup: menuKeyboard,
		})
	}
})

bot.command('menu', (ctx) => {
	ctx.reply(`Выберите действие`, {
	parse_mode: 'HTML',
	reply_markup: menuKeyboard
})
})

bot.command('tickets', async (ctx) => {
	const userId = ctx.message.from.id;
	db.read()
	const invitedUsers = db.data.users[userId];
	let tickets;
	tickets = await invitedUsers.reduce( async  (acc, cur) => {
		try {
			let pass = await bot.api.getChatMember('@shuratest', cur);
			if (pass.status == 'member') {
				console.log(`Пользователь с id: ${cur} подписался на канал, добавляем билетик!`);
				acc = await acc + 1;
			} else {
				console.log(`Пользователь с id: ${cur} не подписан на канал`);
			}
		} catch (error) {
			console.log(`Пользователь с id: ${cur} не подписан на канал`);
		}
		return acc;
	}, 0)
	await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets} ! Итого у вас:  ${tickets} билет(а/ов)`, {
		reply_markup: menuKeyboard
	})
})

bot.command('getContestList', async (ctx) => {
	if (ctx.message.from.id == 951161100) {
		db.read()
		const usersList = Object.keys(db.data.users)
		let contestList = {}
		for (let i = 0; i < usersList.length; i++) {
			const invitedUsers = db.data.users[usersList[i]]
			const invitedUsersCount = invitedUsers.length
			contestList = {
				...contestList,
				[usersList[i]]: invitedUsersCount
			}
		}
		await cl.read()
		await cl.update(({}) => {
			console.log('Запись...');
			cl.data = {...contestList}
		})
		return cl;
	}
})

bot.hears('Проверить билеты', async (ctx) => {
	const userId = ctx.message.from.id;
	db.read()
	const invitedUsers = db.data.users[userId];
	let tickets = 0;
	tickets = await invitedUsers.reduce( async  (acc, cur) => {
		try {
			let pass = await bot.api.getChatMember('@shuratest', cur);
			if (pass.status == 'member') {
				console.log(`Пользователь с id: ${cur} подписался на канал, добавляем билетик!`);
				acc = await acc + 1;
			} else {
				console.log(`Пользователь с id: ${cur} не подписан на канал`);
			}
		} catch (error) {
			console.log(`Пользователь с id: ${cur} не подписан на канал`);
		}
		return acc;
	}, 0)
	await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets} ! Итого у вас:  ${tickets} билет(а/ов)`, {
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
	let sub = ctx.message.from.id
	let newUser = ctx.message.users_shared.users[0];
	let id = newUser.user_id;
	console.log('sub: ', sub, 'newUser: ', id );

	try {
		const pass = await bot.api.getChatMember('@shuratest', id);
		newUser.status = pass.status

		if (newUser.status == 'left') {
			console.log('Сработал 1');
			await ctx.reply('Данные пользователя получены 👍')
			await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/+hA7XB2pUFmJlZDgy')
			await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
				reply_markup: {
					keyboard: createChooseUserBtn(ctx),
					resize_keyboard: true,
					one_time_keyboard: true
				}
			})
			db.read()
			db.update(({ users }) => {
				if (!Object.hasOwn(users, sub)) {
					console.log('Создаем пустой массив для подписчика и добавляем пользоваателя в массив');
					users[sub] = [];
					users[sub].push(id)
				} else if (users[sub].includes(id)) {
					console.log('Этот пользователь уже добавлен в массив');
				} else {
					console.log('Добавляем пользователя в массив')
					users[sub].push(id)
				}
			})
			return db;
		} else if (newUser.status == 'kicked') {
			await ctx.reply(`Пользователь ${newUser.username} заблокирован за нарушение правил канала, попробуйте выбрать другого человка`, {
				reply_markup: {
					keyboard: createChooseUserBtn(ctx),
					resize_keyboard: true,
					one_time_keyboard: true
				}
			})
		} else await ctx.reply(`Пользователь ${newUser.username} уже подписан на канал, попробуйте выбрать другого человка`, {
				reply_markup: {
					keyboard: createChooseUserBtn(ctx),
					resize_keyboard: true,
					one_time_keyboard: true
				}
			})
	} catch (error) {
		console.log('Сработал Catch');
		await ctx.reply('Данные пользователя получены 👍')
		await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/+hA7XB2pUFmJlZDgy')
		await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
			reply_markup: {
				keyboard: createChooseUserBtn(ctx),
				resize_keyboard: true,
				one_time_keyboard: true
			}
		})
		db.read()
		db.update(({ users }) => {
			if (!Object.hasOwn(users, sub)) {
				console.log('Создаем пустой массив для подписчика и добавляем пользоваателя в массив');
				users[sub] = [];
				users[sub].push(id)
			} else if (users[sub].includes(id)) {
				console.log('Этот пользователь уже добавлен в массив');
			} else {
				console.log('Добавляем пользователя в массив')
				users[sub].push(id)
			}
		})
		return db;
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
