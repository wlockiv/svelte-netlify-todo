import gql from "graphql-tag";

export const GET_TODOS = gql`
  query Todos {
    __typename
    todos {
      id
      text
      done
      __typename
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $text: String!, $done: Boolean!) {
    __typename
    updateTodo(id: $id, text: $text, done: $done) {
      id
      text
      done
      __typename
    }
  }
`;

export const CREATE_TODO = gql`
  mutation CreateTodo($text: String!) {
    __typename
    addTodo(text: $text) {
      id
      text
      done
      __typename
    }
  }
`;

export const DELETE_TODO = gql`
  mutation DeleteTodo($id: ID!) {
    __typename
    deleteTodo(id: $id) {
      id
      text
      done
      __typename
    }
  }
`;
