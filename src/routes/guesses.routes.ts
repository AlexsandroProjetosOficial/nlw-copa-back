import { prisma } from "../lib/prisma";
import { FastifyInstance } from 'fastify'
import { authenticate } from "../plugins/authenticate";
import { z } from "zod";

const guessesRoutes = async (fastify: FastifyInstance) => {
	fastify.get('/guesses/count', async (request, replay) => {
		const count = await prisma.guess.count();

		return replay.status(200).send({
			message: 'Guess has been selected successfuly.',
			count: count
		});
	});

	fastify.post('/polls/:pollId/games/:gameId/guesses', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		const createGuessParams = z.object({
			pollId: z.string(),
			gameId: z.string()
		});

		const createGuessBody = z.object({
			firstTeamPoints: z.number(),
			secondTeamPoints: z.number()
		});

		const { pollId, gameId } = createGuessParams.parse(request.params);
		const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(request.body);

		const participant = await prisma.participant.findUnique({
			where: {
				userId_poolId: {
					poolId: pollId,
					userId: request.user.sub
				}
			}
		});

		if (!participant) {
			return replay.status(400).send({
				message: "You're not allowed to create a guess inside this poll."
			});
		};

		const guess = await prisma.guess.findUnique({
			where: {
				participantId_gameId: {
					participantId: participant.id,
					gameId: gameId
				}
			}
		});

		if(guess) {
			return replay.status(400).send({
				message: "You already sent a guess to this game on this poll."
			});
		};

		const game = await prisma.game.findUnique({
			where: {
				id: gameId
			}
		});

		if(!game) {
			return replay.status(400).send({
				message: "Game not found."
			});
		}

		if(game.date < new Date()) {
			return replay.status(400).send({
				message: "You cannot send guesses after the game date."
			});
		}

		await prisma.guess.create({
			data: {
				gameId,
				participantId: participant.id,
				firstTeamPoints,
				secondTeamPoints
			}
		});

		return replay.status(201).send({
			message: 'Guess has been created successfuly.'
		});
	})
};

export { guessesRoutes };