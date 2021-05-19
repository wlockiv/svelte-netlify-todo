const { gql } = require("apollo-server-lambda");

const types = gql`
  type Query {
    todos: [Todo]!
  }

  type Todo {
    id: ID!
    text: String!
    done: Boolean!
  }
`;

exports = { types };
