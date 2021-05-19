import { query as q, Client as FClient } from "faunadb";

const client = new FClient({
  secret: process.env.FAUNA ? process.env.FAUNA : "",
});

export default {
  Query: {
    todos: async (parent, args, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to get todos.");
      }

      const results = await client.query(
        q.Paginate(q.Match(q.Index("todos_by_user"), user))
      );

      return results.data.map(([ref, text, done]) => ({
        id: ref.id,
        text,
        done,
      }));
    },
  },
  Mutation: {
    addTodo: async (_, { text }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to insert todos.");
      }

      const results = await client.query(
        q.Create(q.Collection("todos"), {
          data: {
            text: text,
            done: false,
            owner: user,
          },
        })
      );

      return {
        ...results.data,
        id: results.ref.id,
      };
    },
    updateTodo: async (_, { id, done, text }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to update todos.");
      }

      const results = await client.query(
        q.Update(q.Ref(q.Collection("todos"), id), {
          data: {
            done: done,
            text: text,
          },
        })
      );

      return {
        ...results.data,
        id: results.ref.id,
      };
    },
    deleteTodo: async (_, { id }, { user }) => {
      if (!user) {
        throw new Error("Must be authenticated to delete todos");
      }

      const results = await client.query(
        q.Delete(q.Ref(q.Collection("todos"), id))
      );

      return {
        ...results.data,
        id: results.ref.id,
      };
    },
  },
};
