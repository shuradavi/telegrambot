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

export const chooseWiner = (list) => {
	if (Boolean(list.length)) {
		const max = list.length
		const winnerIdx = Math.floor(Math.random() * max)
		const winnerId = list[winnerIdx]
		return winnerId
	}
}