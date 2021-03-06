import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from "apollo-cache-inmemory";
import { HttpLink } from "apollo-link-http";
import { onError } from "apollo-link-error";
import { ApolloLink, Observable } from "apollo-link";

export const createCache = () => {
  const cache = new InMemoryCache();
  if (process.env.NODE_ENV === 'development') {
    window.secretVariableToStoreCache = cache;
  }
  return cache;
}

// getToken from meta tags
const getToken = () =>  document.querySelector('meta[name="csrf-token"]').getAttribute('content');
const token = getToken();
const setTokenForOperation = async operation =>
operation.setContext({
  headers: {
    'X-CSRF-Token': token,
  },
});

const createLinkWithToken = () =>
  new ApolloLink(
    (operation, forward) =>
      new Observable(observer => {
        let handler;
        Promise.resolve(operation)
          .then(setTokenForOperation)
          .then(() => {
            handler = forward(operation).subscribe({
              next: observer.next.bind(observer),
              error: observer.error.bind(observer),
              complete: observer.complete.bind(observer),
            });
          })
          .catch(observer.error.bind(observer));
          return () => {
            if (handle) handle.subscribe();
          };
      })
  );

// log errors
const logError = (error) => console.log(error);

const createErrorLink = () => onError(({graphQLErrors, networkError, operation}) => {
  if (graphQLErrors) {
    logError('GraphQL - Error', {
      errors: graphQLErrors,
      operarionName: operation.operationName,
      variables: operation.variables,
    })
  }
  if (networkError) {
    logError('GraphQL NetWorkError', networkError);
  }
})

// http link
const createHttpLink = () => new HttpLink({
  uri: '/graphql',
  credentials: 'include',
})

// apollo client instance
export const createClient = (cache, requestLink) => {
  return new ApolloClient({
    link: ApolloLink.from([
      createErrorLink(),
      createLinkWithToken(),
      createHttpLink(),
    ]),
    cache,
  });
};