import { ApolloServer, gql } from "apollo-server-lambda";

const typeDefs = gql`
  type Query {
    hello(name: String): String
  }
`;

const resolvers = {
  Query: {
    hello: (parent, { name }, context) => {
      return `Hello, ${name || "Stranger"}!`;
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  playground: true,
  introspection: true,
});

exports.handler = server.createHandler();
