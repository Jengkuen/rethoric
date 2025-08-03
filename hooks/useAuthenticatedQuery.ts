"use client";

import { FunctionReference } from 'convex/server';
import {
  OptionalRestArgsOrSkip,
  useConvexAuth,
  useQuery,
} from 'convex/react';

/**
 * A wrapper around useQuery that automatically checks authentication state.
 * If the user is not authenticated, the query is skipped.
 */
export function useAuthQuery<
  Query extends FunctionReference<'query'>,
>(query: Query, args: OptionalRestArgsOrSkip<Query>[0] | 'skip') {
  const { isAuthenticated } = useConvexAuth();
  return useQuery(query, isAuthenticated ? args : 'skip');
}