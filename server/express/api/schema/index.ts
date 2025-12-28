import { makeExecutableSchema } from '@graphql-tools/schema';
import {  mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { UserType, BookType } from "../typedefs";
import UserResolver from "../resolvers/UserResolver";
import BookResolver from "../resolvers/BookResolver";
const schema = makeExecutableSchema({
    typeDefs: mergeTypeDefs ([UserType, BookType]),
    resolvers: mergeResolvers([UserResolver, BookResolver])
});
export default schema;