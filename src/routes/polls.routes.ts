import { prisma } from "../lib/prisma";
import { FastifyInstance } from 'fastify'
import { z } from "zod";
import ShortUniqueId from "short-unique-id";
import { authenticate } from "../plugins/authenticate";

const pollsRoutes = async (fastify: FastifyInstance) => {
	fastify.get('/polls/count', async (request, replay) => {
		const count = await prisma.pool.count();

		return replay.status(200).send({
			message: 'Pool has been selected successfuly.',
			count: count
		});
	});

	fastify.get('/polls', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		const polls = await prisma.pool.findMany({
			where: {
				participants: {
					some: {
						userId: request.user.sub
					}
				}
			},

			include: {
				_count: {
					select: {
						participants: true
					}
				},

				participants: {
					select: {
						id: true,

						user: {
							select: {
								avatarUrl: true
							}
						}
					},
					take: 4
				},

				owner: {
					select: {
						name: true,
						id: true
					}
				}
			}
		});

		return replay.status(201).send({
			message: 'Polls has been selected successfuly.',
			polls: polls
		});
	});

	fastify.get('/polls/:id', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		const getPollsParams = z.object({
			id: z.string()
		});

		const { id } = getPollsParams.parse(request.params);

		const poll = await prisma.pool.findUnique({
			where: {
				id: id
			},
			include: {
				_count: {
					select: {
						participants: true
					}
				},

				participants: {
					select: {
						id: true,

						user: {
							select: {
								avatarUrl: true
							}
						}
					},
					take: 4
				},

				owner: {
					select: {
						name: true,
						id: true
					}
				}
			}
		});

		return replay.status(201).send({
			message: 'Pool has been selected successfuly.',
			poll: poll
		});
	})

	fastify.post('/polls', async (request, replay) => {
		const createPoolBody = z.object({
			title: z.string()
		})

		const { title } = createPoolBody.parse(request.body);

		const generateCode = new ShortUniqueId({ length: 6 });

		const code = String(generateCode()).toUpperCase();

		try {
			await request.jwtVerify();

			await prisma.pool.create({
				data: {
					title: title,
					code: code,
					ownerId: request.user.sub,

					participants: {
						create: {
							userId: request.user.sub
						}
					}
				}
			})
		} catch (error) {
			await prisma.pool.create({
				data: {
					title: title,
					code: code
				}
			})
		}

		return replay.status(201).send({
			message: 'Pool has been created successfuly.',
			code: code
		});
	});

	fastify.post('/polls/join', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		const joinPoolBody = z.object({
			code: z.string()
		})

		const { code } = joinPoolBody.parse(request.body);

		const poll = await prisma.pool.findUnique({
			where: {
				code
			},

			include: {
				participants: {
					where: {
						userId: request.user.sub
					}
				}
			}
		});

		if (!poll) {
			return replay.status(400).send({
				message: 'Poll not found'
			});
		}

		if (poll.participants.length > 0) {
			return replay.status(400).send({
				message: 'You already joined this poll'
			});
		}

		if (!poll.ownerId) {
			await prisma.pool.update({
				where: {
					id: poll.id
				},
				data: {
					ownerId: request.user.sub
				}
			});
		};

		await prisma.participant.create({
			data: {
				poolId: poll.id,
				userId: request.user.sub
			}
		});

		return replay.status(201).send({
			message: 'Pool has been created successfuly.'
		});
	})
};

export { pollsRoutes };