import { prisma } from "../lib/prisma";
import { FastifyInstance } from 'fastify'
import { z } from "zod";
import { authenticate } from "../plugins/authenticate";

const gamesRoutes = async (fastify: FastifyInstance) => {
	fastify.get('/polls/:id/games', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		const getPollParams = z.object({
			id: z.string()
		});

		const { id } = getPollParams.parse(request.params);

		let games = await prisma.game.findMany({
			orderBy: {
				date: 'asc'
			},

			include: {
				guesses: {
					where: {
						participant: {
							userId: request.user.sub,
							poolId: id
						}
					}
				}
			}
		});

		games = games.map((game) => {
			return {
				...game,
				guess: game.guesses.length > 0 ? game.guesses.shift() : null,
				guessess: undefined
			}
		})

		return replay.status(200).send({
			message: 'Game has been selected successfuly.',
			games: games
		});
	});

	fastify.post('/games', async (request, replay) => {
		const createGamesBody = z.object({
			date: z.string(),
			firstTeamCountryCode: z.string(),
			secondTeamCountryCode: z.string()
		});

		const { date, firstTeamCountryCode, secondTeamCountryCode } = createGamesBody.parse(request.body);

		await prisma.game.create({
			data: {
				date,
				firstTeamCountryCode,
				secondTeamCountryCode
			}
		});

		return replay.status(201).send({
			message: 'Game has been created successfuly.'
		});
	});
};

export { gamesRoutes };