import 'dotenv/config'
import { LowSync } from 'lowdb'
import { JSONFileSync, JSONFilePreset } from 'lowdb/node'
import { Bot, GrammyError, HttpError, Keyboard } from "grammy";
import { chooseWiner } from './utils.js';
const bot = new Bot(process.env.BOT_TOKEN);
const db = new LowSync(new JSONFileSync('users.json'), { "users": {} })
const cl = await JSONFilePreset(('contestList.json'), { "list": {}})
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
		await ctx.reply(`Привет, ${username}! Я - бот тг-канала: <a href="https://t.me/larichevafood">Oh Laricheva / Ем в Санкт-Петербурге и вам советую</a>`, {
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

bot.command('help', async (ctx) => {
	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
		ctx.reply('Перед розыгрышем необходимо обновить список, отправив боту команду /getContestList, в ответ бот ответит, что запись произведена. Для проведения розыгрыша используйте команду /choose_winner. В ответном сообщении бот вернет победителя!')
	} else ctx.reply('Эта команда доступна только для администраторов')
})

bot.command('choose_winner', async (ctx) => {
	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
		cl.read()
		const winnerId = chooseWiner(cl.data.contestList)
		const pass = await bot.api.getChatMember('@larichevafood', winnerId)
		const winner = pass.user;
		ctx.reply(`В розыгрыше победил ${winner.first_name} @${winner.username}`)
	}
})

bot.command('tickets', async (ctx) => {
	const userId = ctx.message.from.id;
	db.read()
	if (Boolean(db.data.users[userId])) {
		const invitedUsers = db.data.users[userId];
		let tickets = 0
		for (let i=0; i < invitedUsers.length; i++) {
			try {
				let pass = await bot.api.getChatMember('@larichevafood', invitedUsers[i])
				if (pass.status == 'member') {
					tickets += 1
				}
			} catch (error) {
				console.log('error: ', error);
			}
		}		
		await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets}! Итого у вас ${tickets} билет(а/ов)`, {
			reply_markup: menuKeyboard
		})
	} else await ctx.reply('Вы ещё не добавили пригласили ни одного друга, у вас нет билетов для участия в розыгрыше')
	await ctx.reply('Пригласите друзей и участвуйте в розыгрыше', {
		reply_markup: {
			keyboard: createChooseUserBtn(ctx),
			resize_keyboard: true,
			one_time_keyboard: true
		}
	})
})

bot.command('getContestList', async (ctx) => {
	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
		db.read()
		const usersList = Object.keys(db.data.users)
		let contestList = []
		for (let i = 0; i < usersList.length; i++) {
			const userId = usersList[i]
			console.log('id инвайтера', userId);
			const arrayOfInvitedUsers = db.data.users[userId]
			for (let i = 0; i < arrayOfInvitedUsers.length; i++) {

				try {
					const pass = await bot.api.getChatMember('@larichevafood', arrayOfInvitedUsers[i]);
					if (pass.status == 'member') {
						contestList.push(userId)
					}
				} catch (error) {
					console.log('Пользователь не подписался');
				}
				
			}
		}
		console.log(contestList);
		const today = new Date();
		const dd = String(today.getDate()).padStart(2, '0');
		const mm = String(today.getMonth() + 1).padStart(2, '0');
		const yyyy = today.getFullYear();
		const hour = String(today.getHours())
		const min = String(today.getMinutes())
		cl.read()
		cl.update(({ }) => {
			console.log('Запись в contestList');
			cl.data = {contestList}
		})
		await ctx.reply(`Запись произведена, список актуализирован на момент ${dd}.${mm}.${yyyy} ${hour}:${min}`)
		return cl;
	}
	
	
})

bot.hears('Проверить билеты', async (ctx) => {
	const userId = ctx.message.from.id;
	db.read()
	if (Boolean(db.data.users[userId])) {
		const invitedUsers = db.data.users[userId];
		let tickets = 0
		for (let i=0; i < invitedUsers.length; i++) {
			try {
				let pass = await bot.api.getChatMember('@larichevafood', invitedUsers[i])
				if (pass.status == 'member') {
					tickets += 1
				}
			} catch (error) {
				console.log('error: ', error);
			}
		}		
		await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets}! Итого у вас ${tickets} билет(а/ов)`, {
			reply_markup: menuKeyboard
		})
	} else await ctx.reply('Вы ещё не добавили пригласили ни одного друга, у вас нет билетов для участия в розыгрыше')
	await ctx.reply('Пригласите друзей и участвуйте в розыгрыше', {
		reply_markup: {
			keyboard: createChooseUserBtn(ctx),
			resize_keyboard: true,
			one_time_keyboard: true
		}
	})
})

bot.hears('Проверить подписку на канал', async (ctx) => {
	let id = ctx.msg.from.id;
	let pass = await bot.api.getChatMember('@larichevafood', id);

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
		const pass = await bot.api.getChatMember('@larichevafood', id);
		newUser.status = pass.status

		if (newUser.status == 'left') {
			await ctx.reply('Данные пользователя получены 👍')
			await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/larichevafood')
			await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
				reply_markup: {
					keyboard: createChooseUserBtn(ctx),
					resize_keyboard: true,
					one_time_keyboard: true
				}
			})
			db.read()
			db.update(({users}) => {
				if (!Object.hasOwn(users, sub)) {
					console.log('Добавляем нового пользователя в базу из Catch');
					users[sub] = [];
					users[sub].push(id)
				} else if (users[sub].includes(id)) {
				console.log('Данный пользователь уже приглашал этого друга');
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
		await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/larichevafood')
		await ctx.reply(`Как только он подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`, {
			reply_markup: {
				keyboard: createChooseUserBtn(ctx),
				resize_keyboard: true,
				one_time_keyboard: true
			}
		})
		db.read()
		db.update(({users}) => {
			if (!Object.hasOwn(users, sub)) {
				console.log('Добавляем нового пользователя в базу из Catch');
				console.log('sub: ', sub, 'id: ', id, );
				users[sub] = [];
				users[sub].push(id)
			} else if (users[sub].includes(id)) {
				console.log('Данный пользователь уже приглашал этого друга');
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
	await ctx.reply(`[Oh Laricheva / Ем в Санкт-Петербурге и вам советую](https://t.me/larichevafood)`,
		{
			parse_mode: 'MarkdownV2',
			disable_web_page_preview: true
		})
})

bot.hears('Подписаться на канал', (ctx) => {
	ctx.reply('Перейдите в тг канал, подпишитесь и возвращайтесь ко мне: <a href="https://t.me/larichevafood">Oh Laricheva / Ем в Санкт-Петербурге и вам советую</a>', {
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
