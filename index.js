import 'dotenv/config'
import {JSONFilePreset } from 'lowdb/node'
import { Bot, GrammyError, HttpError, Keyboard } from "grammy";
import { chooseWiner } from './utils.js';
const bot = new Bot(process.env.BOT_TOKEN)
const db = await JSONFilePreset(('users.json'), { "users": {} })
const cl = await JSONFilePreset(('contestList.json'), { "list": {} })

// Слушатель для админа: актуализировать список участников
bot.hears('Обновить список', async (ctx) => {
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
					const pass = await bot.api.getChatMember('@testchannel_178', arrayOfInvitedUsers[i]);
					if (pass.status == 'member') {
						contestList.push(userId)
						console.log(`Пользователь ${arrayOfInvitedUsers[i]} подписался, +1 билет для ${userId}`);
					}
				} catch (error) {
					console.log(`Пользователь ${arrayOfInvitedUsers[i]} не подписался`);
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

// Слушатель для админа:: определить победителя
bot.hears('Определить победителя', async (ctx) => {
	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
		await cl.read()
		const winnerId = chooseWiner(cl.data.contestList)
		const pass = await bot.api.getChatMember('@testchannel_178', winnerId)
		const winner = pass.user;
		ctx.reply(`В розыгрыше победил ${winner.first_name} @${winner.username}`)
	}
})

// Спецкоманда: помощь для админа
bot.command('help', async (ctx) => {
	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
		ctx.reply('Перед розыгрышем необходимо обновить список, нажав на соответствующую кнопку, в ответ бот отправит сообщение, что запись произведена. Для проведения розыгрыша используйте нажмите "Определить победителя". В ответном сообщении бот вернет победителя!', {
			reply_markup: new Keyboard().text('Обновить список').row().text('Определить победителя').resized()
		})
	} else ctx.reply('Эта команда доступна только для администраторов')
})	

// Меню
bot.api.setMyCommands([
	{
		command: 'menu',
		description: 'Открыть меню'
	},
]);

// Клавиатура главного меню
const menuKeyboard = new Keyboard()
	.text('Информация о розыгрыше 🎲').row()
	.text('Ссылка на канал 🔗').resized()

// Клавиатура розыгрыша
const lotteryKeyboard = new Keyboard()
	.text('Пригласить друга 👥').row()
	.text('Условия розыгрыша ❗').row()
	.text('Билеты 🎟️')
	.text('В главное меню 🔙').resized()

// Команда: старт
bot.command('start', async (ctx) => {
	if (ctx.from.is_bot === false) {
		const username = ctx.msg.from.username
		await ctx.reply(`Привет, ${username}! \nЯ - бот тг-канала: <a href="https://t.me/testchannel_178">Тестовый канал</a> \nВыберите действие, чтобы продолжить 👇`, {
			parse_mode: 'HTML',
			reply_markup: menuKeyboard
		})
	}
	await ctx.deleteMessage()
})

// Команда: меню
bot.command('menu', async (ctx) => {
	await ctx.deleteMessage()
	await ctx.reply('Выберите действие 💁🏻‍♂️', {
		reply_markup: menuKeyboard
	})
})

// Слушатели кнопок
bot.hears('Информация о розыгрыше 🎲', async (ctx) => {
	await ctx.deleteMessage()
	await ctx.reply('Выберите опцию 💁🏻‍♂️', {
		reply_markup: lotteryKeyboard
	})
})

bot.hears('Ссылка на канал 🔗', async (ctx) => {
	await ctx.deleteMessage()
	await ctx.reply('<a href="https://t.me/testchannel_178">Нажмите для перехода 👈</a>', {
		parse_mode: 'HTML',
		reply_markup: new Keyboard().text('В главное меню 🔙').resized()
	})
})

bot.hears('Пригласить друга 👥', async (ctx) => {
	await ctx.deleteMessage()
	const userId = ctx.update.message.from.id
	try {
		let pass = await bot.api.getChatMember('@testchannel_178', userId)
		if (pass.status == 'left') {
			await ctx.reply('Для участия в розыгрыше вы должны быть подписаны на канал, перейдите по ссылке и подпишитесь: <a href="https://t.me/testchannel_178">канал</a>', {
				parse_mode: 'HTML'
			})
		} else if (pass.status == 'kicked') {
			await ctx.reply('Вы были заблокированы администратором канала за нарушение правил')
		}
		else {
			await ctx.reply('Выберите друга 👇', {
				reply_markup: {
					keyboard: [
						[
							{
								text: 'Контакты',
								request_users: {
									request_id: userId,
									request_username: true,
									user_is_bot: false
								}
							}
						],
						[{text: 'Информация о розыгрыше 🎲'}, { text: 'В главное меню 🔙' }]
					],
					resize_keyboard: true
				}
			})
		}
	} catch (error) {
		console.log('Возникла ошибка: ', error);
	}
	
})

bot.hears('Условия розыгрыша ❗', async (ctx) => {
	const chatId = ctx.update.message.chat.id
	// console.log('ctx: ', ctx.update.message.chat);
	await ctx.api.sendMessage(chatId, 'Для участия в розыгрыше вы должны быть подписаны на канал и пригласить друга.\nВажно❗ Приглашенный друг должен быть подписан на канал на момент подведения итогов розыгрыша.\n1️⃣ Нажмите кнопку "Пригласить друга 👥" и выберите друга из списка контактов.\n2️⃣ Бот отправит вам ссылку-приглашение на канал, вам необходимо скинуть её своему другу и попросить подписаться на канал.\n3️⃣ Чем больше друзей подпишется на канал по вашей ссылке, тем больше билетов розыгрыша вы получите.\n4️⃣ Вы сможете отслеживать количество ваших билетов, нажав на кнопку "Билеты 🎟️"\n5️⃣ Чем больше у вас билетов, тем выше шанс на победу при подведении итогов розыгрыша.')
	await ctx.deleteMessage()
	await ctx.reply('Выберите опцию 💁🏻‍♂️', {
		reply_markup: new Keyboard()
				.text('Пригласить друга 👥').row()
				.text('Билеты 🎟️')
				.text('В главное меню 🔙').resized()
	})
})

bot.hears('Билеты 🎟️', async (ctx) => {
	const userId = ctx.message.from.id;
	db.read()
	if (Boolean(db.data.users[userId])) {
		const invitedUsers = db.data.users[userId];
		let tickets = 0
		for (let i=0; i < invitedUsers.length; i++) {
			try {
				let pass = await bot.api.getChatMember('@testchannel_178', invitedUsers[i])
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
	} else await ctx.reply('❗⚠️ Вы ещё не пригласили ни одного друга, у вас нет билетов для участия в розыгрыше')
	await ctx.reply('Выберите опцию 💁🏻‍♂️', {
		reply_markup: lotteryKeyboard
	})
})

bot.hears('В главное меню 🔙', async (ctx) => {
	await ctx.deleteMessage()
	await ctx.reply('Выберите опцию 💁🏻‍♂️', {
		reply_markup: menuKeyboard
	})
})

// Обработка приглашенного пользователя
bot.on(':users_shared', async (ctx) => {
	const newUserId = ctx.message.user_shared.user_id
	const sponsorId = ctx.message.user_shared.request_id
	try {
		const pass = await bot.api.getChatMember('@testchannel_178', newUserId);
		if (pass.status == 'kicked') {
			await ctx.reply('⛔ Пользователь заблокирован за нарушение правил канала, попробуйте выбрать другого человка')
		} else if (pass.status != 'left') {
			await ctx.reply('❗⚠️ Пользователь уже подписан на канал, попробуйте выбрать другого человка')
		} else if (pass.status == 'left') {
			await db.read()
			if (!Object.hasOwn(db.data.users, sponsorId)) {
				console.log('В базе данных отсутсвует спонсор');
				await db.update(({ users }) => {
					users[sponsorId] = [];
					users[sponsorId].push(newUserId)
				})
				await ctx.reply('🔗 Отправьте ссылку на канал другу и попросите подписаться: https://t.me/testchannel_178')
				await ctx.reply('⏱ Как только ваш друг подпишется на канал, вам добавится билет розыгрыша ')
			} else if (db.data.users[sponsorId].includes(newUserId)) {
				console.log('Данный спонсор уже приглашал этого пользователя');
				await ctx.reply('❗⚠️ Вы уже приглашали этого пользователя\nПопробуйте пригласить кого-нибудь другого')
			} else {
				await db.update(({ users }) => users[sponsorId].push(newUserId))
				console.log('Добавляем нового пользователя в лист приглашений от спонсора')
				await ctx.reply('🔗 Отправьте ссылку на канал другу и попросите подписаться: https://t.me/testchannel_178')
				await ctx.reply('⏱ Как только ваш друг подпишется на канал, вам добавится билет розыгрыша ')
			}
		}
	} catch (error) {
		console.log('CATCH Пользователь не открывал бота ранее');
		await db.read()
		if (!Object.hasOwn(db.data.users, sponsorId)) {
			console.log('CATCH В базе данных отсутсвует спонсор');
			await db.update(({ users }) => {
				users[sponsorId] = [];
				users[sponsorId].push(newUserId)
			})
			await ctx.reply('🔗 Отправьте ссылку на канал другу и попросите подписаться: https://t.me/testchannel_178')
			await ctx.reply('⏱ Как только ваш друг подпишется на канал, вам добавится билет розыгрыша ')
		} else if (db.data.users[sponsorId].includes(newUserId)) {
			console.log('CATCH Данный спонсор уже приглашал этого пользователя');
			await ctx.reply('❗⚠️ Вы уже приглашали этого пользователя\nПопробуйте пригласить кого-нибудь другого')
		} else {
			await db.update(({ users }) => users[sponsorId].push(newUserId))
			console.log('CATCH Добавляем нового пользователя в лист приглашений от спонсора')
			await ctx.reply('🔗 Отправьте ссылку на канал другу и попроосите подписаться: https://t.me/testchannel_178')
			await ctx.reply('⏱ Как только ваш друг подпишется на канал, вам добавится билет розыгрыша ')
		}
	}
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

bot.on('message', async (ctx) => {
	await ctx.reply('Мне более нечего добавить...', {
		reply_parameters: {message_id: ctx.msg.message_id}
	})
})
bot.start();
