import { prisma } from "../lib/prisma";
import { FastifyInstance } from 'fastify'
import { z } from "zod";
import { authenticate } from "../plugins/authenticate";

const authsRoutes = async (fastify: FastifyInstance) => {
	fastify.post('/users', async (request, replay) => {
		const createUserBody = z.object({
			access_token: z.string()
		});

		const { access_token } = createUserBody.parse(request.body);

		const userResponse = fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			method: 'GET',
			headers: {
				Authorization: `Bearer ${access_token}`
			}
		});

		const userData = await (await userResponse).json();

		const userInfoSchema = z.object({
			id: z.string(),
			email: z.string().email(),
			name: z.string(),
			picture: z.string().url()
		});

		const userInfo = userInfoSchema.parse(userData);

		let user = await prisma.user.findUnique({
			where: {
				googleId: userInfo.id
			}
		});

		if (!user) {
			user = await prisma.user.create({
				data: {
					googleId: userInfo.id,
					name: userInfo.name,
					email: userInfo.email,
					avatarUrl: userInfo.picture
				}
			});
		};

		const token = fastify.jwt.sign({
			name: user.name,
			avatarUrl: user.avatarUrl
		}, {
			sub: user.id,
			expiresIn: '7 days'
		});

		return replay.status(200).send({
			message: 'User has been created or logged successfuly.',
			token: token
		});
	});

	fastify.get('/me', {
		onRequest: [authenticate]
	}, async (request, replay) => {
		return replay.status(200).send({
			message: 'User has been selected successfuly.',
			user: request.user
		});
	});
};

export { authsRoutes };