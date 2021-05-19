const { ApolloServer } = require("apollo-server-lambda");
const faunadb = require("faunadb");
const { types } = require("./types");

const q = faunadb.query;
const client = new faunadb.Client({
  secret: process.env.FAUNA,
});
