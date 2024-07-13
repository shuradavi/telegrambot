// export const isDbEmpty = (db) => {
// 	return !Boolean(db.data.users.length())
// }

// export const doesDbHaveSub = (db, sponsorId) => {
// 	return db.data.users
// }

export const chooseWiner = (list) => {
	if (Boolean(list.length)) {
		const max = list.length
		const winnerIdx = Math.floor(Math.random() * max)
		const winnerId = list[winnerIdx]
		return winnerId
	}
}

