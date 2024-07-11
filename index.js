import 'dotenv/config'
import {JSONFilePreset } from 'lowdb/node'
import { Bot, GrammyError, HttpError, InlineKeyboard, Keyboard } from "grammy";
import { chooseWiner } from './utils.js';
const bot = new Bot(process.env.BOT_TOKEN)
const db = await JSONFilePreset(('users.json'), { "users": {} })
const cl = await JSONFilePreset(('contestList.json'), { "list": {} })
// функция имитация спинера во время обработки загрузки
const timeoutSpinner = async (ctx) => {
	await ctx.editMessageText('Выполняется обработка запроса...')
}

// Меню
bot.api.setMyCommands([
	{
		command: 'menu',
		description: 'Открыть меню'
	},
]);

// Создаем клавиатуру для меню
// const menuLabels = ['Проверить подписку на канал', 'Проверить билеты'];
// const onFailSub = ['Подписаться на канал', '<- Назад в меню'];
// const menuRows = menuLabels.map((label) => {
// 	return [
// 		Keyboard.text(label)
// 	]
// })
// const onFailSubRows = onFailSub.map((label) => {
// 	return [
// 		Keyboard.text(label)
// 	]
// })

// const shareUserKeyboard = new Keyboard().text('Пригласить друга').row().text('Проверить билеты').row().text('<- Назад в меню').resized()
// const onFailSubKeyboard = Keyboard.from(onFailSubRows).resized().oneTime()

// Инлайн клавиатура для админа
// const labelHelpData = [
// 	['Произвести актуализацию и розыгрыш', 'getContestAndChooseWinner'],
// 	['Пустая кнопка', 'null'],
// ];
// const labelHelpData2 = [
// 	['123', '123'],
// 	['Пустая кнопка', 'null'],
// ];
// const helpButtonRow = labelHelpData.map(([label, data]) => InlineKeyboard.text(label, data));
// const helpButtonRow2 = labelHelpData2.map(([label, data]) => InlineKeyboard.text(label, data));


// const inlineKeyboardHelper = InlineKeyboard.from([helpButtonRow])
// const inlineKeyboardHelper2 = InlineKeyboard.from([helpButtonRow2])

// Команда: старт
bot.command('start', async (ctx) => {
	if (ctx.from.is_bot === false) {
		const username = ctx.msg.from.username
		await ctx.reply(`Привет, ${username}! \nЯ - бот тг-канала: <a href="https://t.me/testchannel_178">Тестовый канал</a> \nВыберите действие, чтобы продолжить 👇`, {
			parse_mode: 'HTML',
			reply_markup: new Keyboard()
				.text('Информация о розыгрыше').row()
				.text('Ссылка на канал').resized()
		})
		await ctx.deleteMessage()
	}
})

bot.hears('Информация о розыгрыше', async (ctx) => {
	// console.log('context: ', ctx);
	const chatId = ctx.update.message.chat.id;
	const msgId = ctx.update.message.message_id
	console.log('chatId: ', chatId, 'msgId', msgId);
	await ctx.deleteMessage()
	await ctx.editMessageText('text', {chat_id: chatId, message_id: msgId-1})
	// await ctx.reply('Для участия в розыгрыше: \nПодпишись на канал 🟥 \nПригласи друга', {
	// 	reply_markup: new Keyboard()
	// 		.text('Проверить подписку на канал').row()
	// 		.text('Условия проведения розыгрыша').row()
	// 		.text('В главное меню').resized()
	// })
})

bot.hears('Ссылка на канал', async (ctx) => {
	const prevId = ctx.update.message.message_id - 1
	const chatId = ctx.update.message.chat.id
	bot.api.deleteMessage(chatId, prevId)
	await ctx.deleteMessage()
	await ctx.reply('<a href="https://t.me/testchannel_178">Нажмите для перехода</a>', {
		parse_mode: 'HTML'
	})
})

// bot.callbackQuery('open_menu', async (ctx) => {
// 	await ctx.editMessageText('Изменил текст', {
		
// 	})
	// await ctx.reply('Выберите действие', {reply_markup: new Keyboard().text('Розыгрыш').url()})

// })

// Сценарий 1 Этап 1
// Принять участие в розыгрыше
// bot.callbackQuery('participate', async (ctx) => {
// 	await ctx.editMessageText(`Для участия в розыгрыше:
// Подпишись на канал 🟥
// Пригласи друга 🟥`)
// 	await ctx.editMessageReplyMarkup({ reply_markup: new InlineKeyboard().text('Проверить подписку на канал', 'check_sub') })
// 	await ctx.answerCallbackQuery()
// })

// Сценарий 1 Этап 2
// Проверка подписки на канал
// bot.callbackQuery('check_sub', async (ctx) => {
// 	const id = ctx.update.callback_query.from.id
// 	const chatId = ctx.update.callback_query.message.chat.id;
// 	try {
// 		timeoutSpinner(ctx)
// 		let pass = await bot.api.getChatMember('@testchannel_178', id)
// 		if (pass.status == 'left') {
// 			setTimeout(async() => {
// 				await ctx.editMessageText(`Вы не подписаны на канал ❌
// 					Перейдите по ссылке и подпишитесь на канал 👇`)
// 				await ctx.editMessageReplyMarkup({reply_markup: new InlineKeyboard().text('Перейти и подписаться на канал', 'go_and_sub').text('Проверить подписку на канал', 'check_sub')})
// 			}, 500)
// 		} else {
// 			setTimeout(async () => {
// 				await ctx.answerCallbackQuery('Проверка успешно пройдена 👍🏻')
// 				await ctx.editMessageText(`Для участия в розыгрыше необходимо:
// 					Подпишись на канал ✅
// 					Пригласи друга 🟥`
// 				)
// 				await bot.api.sendMessage(chatId, 'Выберите друга из списка контактов', {
// 					reply_markup: {
// 						keyboard: [[{
// 							text: 'Перейти к списку контактов',
// 							request_user: {
// 								request_id: id,
// 								user_is_bot: false
// 							}
// 						}]],
// 						resize_keyboard: true,
// 						one_time_keyboard: true
// 					}
// 				})
// 			}, 500);
// 		}
// 	} catch (error) {
// 		console.log('error');
// 	}
// })

// Сценарий 1 Этап 3а
// Переход на канал для подписки
// bot.callbackQuery('go_and_sub', async (ctx) => {

// })

// Сценарий 1 Этап 3б
// Пригласить друга
// bot.callbackQuery('invite_friend', async (ctx) => {
// 	const id = ctx.update.callback_query.from.id
// 	const chatId = ctx.update.callback_query.message.chat.id;
// 	const msgId = ctx.update.callback_query.message.message_id - 1
// 	bot.api.deleteMessage(chatId, msgId)
// 	await bot.api.sendMessage(chatId, 'Выберите друга из списка контактов', {
// 		reply_markup: {
// 			keyboard: [[{
// 				text: 'Перейти к списку контактов',
// 				request_user: {
// 					request_id: id,
// 					user_is_bot: false
// 				}
// 			}]],
// 			resize_keyboard: true,
// 			one_time_keyboard: true
// 		}
// 	})
// })
// Обработка приглашенного пользователя новая версия
// bot.on

// Обработка приглашенного пользователя старая версия
// bot.on(':users_shared', async (ctx) => {
// 	// console.log('CONTEXT => ', ctx);
// 	const chatId = ctx.update.message.chat.id
// 	const msgId = ctx.update.message.message_id - 1
// 	const newUserId = ctx.message.user_shared.user_id
// 	const sponsorId = ctx.message.user_shared.request_id
// 	console.log('chatId: ', chatId, 'msgId', msgId);
// 	bot.api.deleteMessage(chatId, msgId)
// 	await bot.api.editMessageText(chatId, msgId-1, `Для участия в розыгрыше необходимо:
// 		Подпишись на канал ✅
// 		Пригласи друга ✅`)
// 	try {
// 		const pass = await bot.api.getChatMember('@testchannel_178', newUserId);
// 		if (pass.status == 'left') {
// 			// await ctx.reply('Данные пользователя получены 👍')
// 			// await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/testchannel_178')
// 			db.read()
// 			if (!Object.hasOwn(db.data.users, sponsorId)) {
// 				console.log('В базе данных отсутсвует спонсор');
// 				db.update(({ users }) => {
// 					users[sponsorId] = [];
// 					users[sponsorId].push(newUserId)
// 				})
// 				await ctx.reply(`Вы добавлены в список участников 📋\nКак только ваш друг подпишется на канал, вам добавится билет розыгрыша ⏱`, {
// 					reply_markup: new InlineKeyboard().text('Пригласить еще одного друга', 'invite_friend').url('Oh Laricheva / Ем в Санкт-Петербурге и вам советую.', 'https://t.me/larichevafood')
// 				})
// 			} else if (db.data.users[sponsorId].includes(newUserId)) {
// 				console.log('Данный спонсор уже приглашал этого пользователя');
// 				await ctx.reply(`Вы уже приглашали этого пользователя 😢\nПопробуйте пригласить кого-нибудь другого`)
// 			} else {
// 				db.update(({users}) => users[sponsorId].push(newUserId))
// 				console.log('Добавляем нового пользователя в лист приглашений от спонсора')
// 				await ctx.reply(`Я записал еще одного вашего друга в список 🔥\nКак только ваш друг подпишется на канал, вам добавится билет розыгрыша ⏱`)
// 			}
// 			return db;
// 		} else if (pass.status == 'kicked') {
// 			await ctx.reply(`Пользователь заблокирован за нарушение правил канала, попробуйте выбрать другого человка`)
// 		} else await ctx.reply(`Пользователь уже подписан на канал, попробуйте выбрать другого человка`)
// 	} catch (error) {
// 		console.log('Сработал Catch');
// 		// await ctx.reply('Данные пользователя получены 👍')
// 		// await ctx.reply('Для участия в розыгрыше отправьте ссылку другу: https://t.me/testchannel_178')
// 		// await ctx.reply(`Как только пользователь подпишется на канал, вам добавится билет розыгрыша. Помните, чем больше друзей подпишется на канал, тем выше шанс на победу`)
// 		db.read()
// 			if (!Object.hasOwn(db.data.users, sponsorId)) {
// 				console.log('В базе данных отсутсвует спонсор');
// 				db.update(({ users }) => {
// 					users[sponsorId] = [];
// 					users[sponsorId].push(newUserId)
// 				})
// 				await ctx.reply(`Вы добавлены в список участников 📋\nКак только ваш друг подпишется на канал, вам добавится билет розыгрыша ⏱`)
// 			} else if (db.data.users[sponsorId].includes(newUserId)) {
// 				console.log('Данный спонсор уже приглашал этого пользователя');
// 				await ctx.reply(`Вы уже приглашали этого пользователя 😢\nПопробуйте пригласить кого-нибудь другого`)
// 			} else {
// 				db.update(({users}) => users[sponsorId].push(newUserId))
// 				console.log('Добавляем нового пользователя в лист приглашений от спонсора')
// 				await ctx.reply(`Я записал еще одного вашего друга в список 🔥\nКак только ваш друг подпишется на канал, вам добавится билет розыгрыша ⏱`)
// 			}
// 			return db;
// 	}
// 	})

// Команда: меню
bot.command('menu', (ctx) => {
	ctx.reply(`Выберите действие`, {
		parse_mode: 'HTML',
		reply_markup: new Keyboard()
				.text('Информация о розыгрыше').row()
			.text('Ссылка на канал').resized()
	})
})

// Команда: билеты
// bot.command('tickets', async (ctx) => {
// 	const userId = ctx.message.from.id;
// 	db.read()
// 	if (Boolean(db.data.users[userId])) {
// 		const invitedUsers = db.data.users[userId];
// 		let tickets = 0
// 		for (let i=0; i < invitedUsers.length; i++) {
// 			try {
// 				let pass = await bot.api.getChatMember('@testchannel_178', invitedUsers[i])
// 				if (pass.status == 'member') {
// 					tickets += 1
// 				}
// 			} catch (error) {
// 				console.log('error: ', error);
// 			}
// 		}		
// 		await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets}! Итого у вас ${tickets} билет(а/ов)`, {
// 			reply_markup: menuKeyboard
// 		})
// 	} else await ctx.reply('Вы ещё не добавили пригласили ни одного друга, у вас нет билетов для участия в розыгрыше')
// 	await ctx.reply('Пригласите друзей и участвуйте в розыгрыше', {
// 		reply_markup: {
// 			keyboard: createChooseUserBtn(ctx),
// 			resize_keyboard: true,
// 			one_time_keyboard: true
// 		}
// 	})
// })


// Спецкоманды для админа
// bot.callbackQuery('getContestAndChooseWinner', async (ctx) => {
// 	bot.api.editMessageReplyMarkup(
// 		ctx.update.callback_query.message.chat.id,
// 		ctx.update.callback_query.message.message_id, {
// 			reply_markup: inlineKeyboardHelper2
// 	})
// 	await ctx.reply('В конкурсе победил %имя', {
		
// 	})
// 	await ctx.answerCallbackQuery({
// 		text: 'Победитель определен!'
// 	})
// })
	// Спецкоманда: актуализировать список участников
// bot.command('getContestList', async (ctx) => {
// 	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
// 		db.read()
// 		const usersList = Object.keys(db.data.users)
// 		let contestList = []
// 		for (let i = 0; i < usersList.length; i++) {
// 			const userId = usersList[i]
// 			console.log('id инвайтера', userId);
// 			const arrayOfInvitedUsers = db.data.users[userId]
// 			for (let i = 0; i < arrayOfInvitedUsers.length; i++) {

// 				try {
// 					const pass = await bot.api.getChatMember('@testchannel_178', arrayOfInvitedUsers[i]);
// 					if (pass.status == 'member') {
// 						contestList.push(userId)
// 					}
// 				} catch (error) {
// 					console.log('Пользователь не подписался');
// 				}
				
// 			}
// 		}
// 		console.log(contestList);
// 		const today = new Date();
// 		const dd = String(today.getDate()).padStart(2, '0');
// 		const mm = String(today.getMonth() + 1).padStart(2, '0');
// 		const yyyy = today.getFullYear();
// 		const hour = String(today.getHours())
// 		const min = String(today.getMinutes())
// 		cl.read()
// 		cl.update(({ }) => {
// 			console.log('Запись в contestList');
// 			cl.data = {contestList}
// 		})
// 		await ctx.reply(`Запись произведена, список актуализирован на момент ${dd}.${mm}.${yyyy} ${hour}:${min}`)
// 		return cl;
// 	}
	
	
// })

	// Спецкоманда: помощь для админа
// bot.command('help', async (ctx) => {
// 	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
// 		ctx.reply('Перед розыгрышем необходимо обновить список, отправив боту команду /getContestList, в ответ бот ответит, что запись произведена. Для проведения розыгрыша используйте команду /choose_winner. В ответном сообщении бот вернет победителя!', {
// 			reply_markup: inlineKeyboardHelper
// 		})
// 	} else ctx.reply('Эта команда доступна только для администраторов')
// })	

	// Спецкоманда: определить победителя
// bot.command('choose_winner', async (ctx) => {
// 	if (ctx.message.from.id == 951161100 || ctx.message.from.id == 1070235538) {
// 		cl.read()
// 		const winnerId = chooseWiner(cl.data.contestList)
// 		const pass = await bot.api.getChatMember('@testchannel_178', winnerId)
// 		const winner = pass.user;
// 		ctx.reply(`В розыгрыше победил ${winner.first_name} @${winner.username}`)
// 	}
// })

// Слушатель: билеты
// bot.hears('Проверить билеты', async (ctx) => {
// 	const userId = ctx.message.from.id;
// 	db.read()
// 	if (Boolean(db.data.users[userId])) {
// 		const invitedUsers = db.data.users[userId];
// 		let tickets = 0
// 		for (let i=0; i < invitedUsers.length; i++) {
// 			try {
// 				let pass = await bot.api.getChatMember('@testchannel_178', invitedUsers[i])
// 				if (pass.status == 'member') {
// 					tickets += 1
// 				}
// 			} catch (error) {
// 				console.log('error: ', error);
// 			}
// 		}		
// 		await ctx.reply(`Из ${invitedUsers.length} приглашенных Вами друзей подписались ${tickets}! Итого у вас ${tickets} билет(а/ов)`, {
// 			reply_markup: menuKeyboard
// 		})
// 	} else await ctx.reply('Вы ещё не добавили пригласили ни одного друга, у вас нет билетов для участия в розыгрыше')
// 	await ctx.reply('Пригласите друзей и участвуйте в розыгрыше', {
// 		reply_markup: {
// 			keyboard: createChooseUserBtn(ctx),
// 			resize_keyboard: true,
// 			one_time_keyboard: true
// 		}
// 	})
// })

// // Слушатель: проверить подписку
// bot.hears('Проверить подписку на канал', async (ctx) => {
// 	let id = ctx.msg.from.id;
// 	let pass = await bot.api.getChatMember('@testchannel_178', id);

// 	if (pass.status == 'left') {
// 		await ctx.reply('Вы не подписаны на канал',
// 			{
// 				reply_parameters: { message_id: ctx.msg.message_id },
// 				reply_markup: onFailSubKeyboard
// 			}
// 		)
// 	} else {
// 		await ctx.reply('Вы подписаны на канал, приглашайте друзей для участия в розыгрыше',
// 			{
// 				reply_parameters: { message_id: ctx.msg.message_id },
// 				reply_markup: shareUserKeyboard
// 			}
// 		)
// 	}
// })

// bot.callbackQuery()
// bot.hears('Пригласить друга', async (ctx) => {
// 	await ctx.reply('Выберите друга из списка контактов', {
// 		reply_markup: {
// 			keyboard: createChooseUserBtn(ctx),
// 			resize_keyboard: true,
// 			one_time_keyboard: true
// 		}
// 	})
// })



	
// bot.hears('<- Назад в меню', async (ctx) => {
// 	await ctx.reply('Выберите действие',
// 		{
// 			reply_markup: menuKeyboard
// 		}
// 	)
// })

// bot.hears('Перейти в тг-канал', async (ctx) => {
// 	await ctx.reply(`[testchannel_178](https://t.me/testchannel_178)`,
// 		{
// 			parse_mode: 'MarkdownV2',
// 			disable_web_page_preview: true
// 		})
// })

// bot.hears('Подписаться на канал', (ctx) => {
// 	ctx.reply('Перейдите в тг канал, подпишитесь и возвращайтесь ко мне: <a href="testchannel_178">Тестовый канал</a>', {
// 		parse_mode: 'HTML',
// 	})
// })

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
