import Fastify from "fastify";
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { pollsRoutes } from "./routes/polls.routes";
import { usersRoutes } from "./routes/users.routes";
import { guessesRoutes } from "./routes/guesses.routes";
import { gamesRoutes } from "./routes/games.routes";
import { authsRoutes } from "./routes/auth.routes";

const main = async () => {
	const fastify = Fastify({
		logger: true
	});

	await fastify.register(cors, {
		origin: true
	});

	await fastify.register(jwt, {
		secret: 'nwlCopa'
	})

	await fastify.register(authsRoutes);
	await fastify.register(pollsRoutes);
	await fastify.register(usersRoutes);
	await fastify.register(guessesRoutes);
	await fastify.register(gamesRoutes);

	await fastify.listen({ port: 3333, host: '0.0.0.0' });
}

main();