// Функция создания кнопки выбора пользователя
export const createChooseUserBtn = (ctx) => {
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

export const isDbEmpty = (db) => {
	return !Boolean(db.data.users.length())
}

export const doesDbHaveSub = (db, sub) => {
	return db.data.users
}

export const isSub = async (str, user_id) => {
	const pass = await bot.api.getChatMember(str, user_id);
	if (pass.status == 'member') {
		return true
	} else return false
}

export const chooseWiner = (list) => {
	const max = list.length
	const winnerIdx = Math.floor(Math.random() * max)
	const winnerId = list[winnerIdx]
	return winnerId
}