import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from 'apollo-boost';
import { getAccessToken, isLoggedIn } from './auth';
import { gql } from '../../server/node_modules/apollo-server-core/dist';

const endpointURL = 'http://localhost:9000/graphql';

// add apollo client

const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
    operation.setContext({
      headers: {
        authorization: 'Bearer ' + getAccessToken(),
      },
    });
  }
  return forward(operation);
});

const client = new ApolloClient({
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  cache: new InMemoryCache(),
});

// async function graphqlRequest(query, variables = {}) {
//   const request = {
//     method: 'POST',
//     headers: { 'content-type': 'application/json' },
//     body: JSON.stringify({
//       query,
//       variables,
//     }),
//   };

//   if (isLoggedIn()) {
//     request.headers['authorization'] = 'Bearer ' + getAccessToken();
//   }

//   const response = await fetch(endpointURL, request);

//   const responseBody = await response.json();

//   if (responseBody.errors) {
//     const message = responseBody.errors
//       .map((error) => error.message)
//       .join('\n');

//     throw new Error(message);
//   }

//   return responseBody.data;
// }

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const companyQuery = gql`
  query companyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
      }
    }
  }
`;

const jobQuery = gql`
  query JobQuery($id: ID!) {
    job(id: $id) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobsQuery = gql`
  query JobsQuery {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
`;

export async function createJob(input) {
  const {
    data: { job },
  } = await client.mutate({
    createJobMutation,
    variables: { input },
    update: (cache, { data }) => {
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });

  // const { job } = await graphqlRequest(mutation, { input });
  return job;
}

export async function loadJob(id) {
  // const { job } = await graphqlRequest(query, { id });

  const {
    data: { job },
  } = await client.query({ query: jobQuery, variables: { id } });
  return job;
}

export async function loadJobs() {
  const {
    data: { jobs },
  } = await client.query({ query: jobsQuery, fetchPolicy: 'no-cache' });
  // const { jobs } = await graphqlRequest(query);
  return jobs;
}

export async function loadCompany(id) {
  const {
    data: { company },
  } = await client.query({ query: companyQuery, variables: { id } });

  // const { company } = await graphqlRequest(query, { id });
  return company;
}
