import { ApolloServer, gql } from "apollo-server-lambda";
import typeDefs from "./src/typeDefs";
import resolvers from "./src/resolvers";

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ context }) => {
    if (context.clientContext.user) {
      return { user: context.clientContext.user.sub };
    }

    return {};
  },
  playground: true,
  introspection: true,
});

exports.handler = server.createHandler();
