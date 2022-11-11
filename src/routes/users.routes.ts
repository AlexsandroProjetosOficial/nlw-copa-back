import { prisma } from "../lib/prisma";
import { FastifyInstance } from 'fastify'

const usersRoutes = async (fastify: FastifyInstance) => {
	fastify.get('/users/count', async (request, replay) => {
		const count = await prisma.user.count();

		return replay.status(200).send({
			message: 'User has been selected successfuly.',
			count: count
		});
	});
};

export { usersRoutes };