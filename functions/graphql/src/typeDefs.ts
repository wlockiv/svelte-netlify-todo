import { gql } from "apollo-server-lambda";

export default gql`
  type Query {
    todos: [Todo]!
  }
  type Todo {
    id: ID!
    text: String!
    done: Boolean!
  }
  type Mutation {
    addTodo(text: String!): Todo
    updateTodo(id: ID!, done: Boolean!, text: String!): Todo
    deleteTodo(id: ID!): Todo
  }
`;
