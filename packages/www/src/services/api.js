import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
} from "@apollo/client/core";
import { setContext as apolloSetContext } from "@apollo/client/link/context";
import { get } from "svelte/store";
import { user } from "../store";

const currentUser = () => get(user);

const httpLink = createHttpLink({
  uri: "/.netlify/functions/graphql",
});

const authLink = apolloSetContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      Authorization: currentUser() ? `Bearer ${currentUser().accessToken}` : "",
    },
  };
});

const cache = new InMemoryCache({
  addTypename: true,
  typePolicies: {
    Query: {
      fields: {
        todos: {
          merge: false,
        },
      },
    },
  },
});

export const client = new ApolloClient({
  uri: "/.netlify/functions/graphql",
  link: authLink.concat(httpLink),
  cache,
});
