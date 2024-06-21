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


