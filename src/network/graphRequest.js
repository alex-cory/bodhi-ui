import _ from 'lodash';
import gql from 'graphql-tag';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { endpoint } from '../config/app';
import GraphParser from './graphParser';
import { isValidEnum, getQueryFields } from './graphDataStruct';

const client = new ApolloClient({
  link: new HttpLink({ uri: endpoint.graphql }),
  cache: new InMemoryCache(),
});

class GraphRequest {
  constructor(queryName) {
    this.queryName = queryName;
    this.filters = undefined;
    this.orderBy = undefined;
  }

  setFilters(filters) {
    this.filters = filters;
  }

  setOrderBy(orderBy) {
    this.orderBy = orderBy;
  }

  getFilterString() {
    let filterStr = '';
    if (this.filters) {
      // Create entire string for OR: [] as objects
      _.forEach(this.filters, (obj, index) => {
        if (!_.isEmpty(filterStr)) {
          filterStr = filterStr.concat(',');
        }
        const str = Object
          .keys(obj)
          .map((key) => {
            if (isValidEnum(key, obj[key]) || !_.isString(obj[key])) {
              // Enums require values without quotes
              return `${key}: ${obj[key]}`;
            }
            return `${key}: ${JSON.stringify(obj[key])}`;
          })
          .join(',');
        filterStr = filterStr.concat(`{${str}}`);
      });

      filterStr = `
        filter: { 
          OR: [ 
            ${filterStr} 
          ]
        }
      `;
    }
    return filterStr;
  }

  getOrderByString() {
    return this.orderBy ? `orderBy: ${this.orderBy}` : '';
  }

  build() {
    const filterStr = this.getFilterString();
    const orderByStr = this.getOrderByString();
    const funcParamOpen = !_.isEmpty(filterStr) || !_.isEmpty(orderByStr) ? '(' : '';
    const funcParamClose = !_.isEmpty(filterStr) || !_.isEmpty(orderByStr) ? ')' : '';

    const query = `
      query {
        ${this.queryName}${funcParamOpen}
          ${filterStr}
          ${orderByStr} 
        ${funcParamClose} {
          ${getQueryFields(this.queryName)}
        }
      }
    `;

    return query;
  }

  async execute() {
    const query = this.build();
    console.debug(query);

    const res = await client.query({
      query: gql`${query}`,
      fetchPolicy: 'network-only',
    });
    return GraphParser.getParser(this.queryName)(res.data[this.queryName]);
  }
}

/*
* Queries allTopics from GraphQL with optional filters.
* @param filters {Array} Array of objects for filtering. ie. [{ status: 'WAITRESULT' }, { status: 'OPENRESULTSET' }]
*/
export function queryAllTopics(filters, orderBy) {
  const request = new GraphRequest('allTopics');
  if (!_.isEmpty(filters)) {
    request.setFilters(filters);
  }
  if (!_.isEmpty(orderBy)) {
    request.setOrderBy(orderBy);
  }
  return request.execute();
}

/*
* Queries allOracles from GraphQL with optional filters.
* @param filters {Array} Array of objects for filtering. ie. [{ status: 'WAITRESULT' }, { status: 'OPENRESULTSET' }]
*/
export function queryAllOracles(filters, orderBy) {
  const request = new GraphRequest('allOracles');
  if (!_.isEmpty(filters)) {
    request.setFilters(filters);
  }
  if (!_.isEmpty(orderBy)) {
    console.log(orderBy);
    request.setOrderBy(orderBy);
  }
  return request.execute();
}

/*
* Queries syncInfo from GraphQL.
*/
export function querySyncInfo() {
  return new GraphRequest('syncInfo').execute();
}
