import gql from "graphql-tag";

export const GET_TODOS = gql`
  query Todos {
    todos {
      id
      text
      done
    }
  }
`;

export const UPDATE_TODO = gql`
  mutation UpdateTodo($id: ID!, $text: String!, $done: Boolean!) {
    updateTodo(id: $id, text: $text, done: $done) {
      id
      text
      done
    }
  }
`;

export const CREATE_TODO = gql`
  mutation CreateTodo($text: String!) {
    addTodo(text: $text) {
      id
      text
      done
    }
  }
`;
