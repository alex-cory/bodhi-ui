import { observable, action, runInAction, reaction, toJS } from 'mobx';
import _ from 'lodash';
import { SortBy, Token, OracleStatus, Routes } from 'constants';

import { queryAllOracles } from '../../network/graphql/queries';

const INIT_VALUES = {
  loaded: false, // loading state?
  loadingMore: false, // for laoding icon?
  list: [], // data list
  hasMore: true, // has more data to fetch?
  skip: 0, // skip
  limit: 16, // loading batch amount
  sortBy: SortBy.DEFAULT,
};

export default class QtumPredictionStore {
  @observable loaded = INIT_VALUES.loaded
  @observable loadingMore = INIT_VALUES.loadingMore
  @observable list = INIT_VALUES.list
  @observable hasMore = INIT_VALUES.hasMore
  @observable skip = INIT_VALUES.skip
  @observable sortBy = INIT_VALUES.sortBy
  limit = INIT_VALUES.limit

  constructor(app) {
    this.app = app;
    reaction(
      () => this.sortBy + toJS(this.app.wallet.addresses) + this.app.global.syncBlockNum + this.app.refreshing.status,
      () => {
        if (this.app.ui.location === Routes.QTUM_PREDICTION) {
          this.init();
        }
      }
    );
    reaction(
      () => this.app.global.online,
      () => {
        if (this.app.ui.location === Routes.QTUM_PREDICTION && this.app.global.online) {
          if (this.loadingMore) this.loadMore();
          else this.init();
        }
      }
    );
  }

  @action
  init = async () => {
    Object.assign(this, INIT_VALUES);
    this.app.ui.location = Routes.QTUM_PREDICTION;
    await this.loadFirst();
  }

  @action
  loadFirst = async () => {
    this.hasMore = true;
    this.list = await this.fetch(this.limit, 0);
    runInAction(() => {
      this.loaded = true;
    });
  }

  @action
  loadMore = async () => {
    if (this.hasMore) {
      this.loadingMore = true;
      this.skip += this.limit;
      try {
        const nextFewEvents = await this.fetch(this.limit, this.skip);
        runInAction(() => {
          this.list = [...this.list, ...nextFewEvents];
          this.loadingMore = false;
        });
      } catch (e) {
        this.skip -= this.limit;
      }
    }
  }

  async fetch(limit = this.limit, skip = this.skip) {
    if (this.hasMore) {
      const orderBy = { field: 'endTime', direction: this.sortBy };
      const filters = [
        { token: Token.QTUM, status: OracleStatus.VOTING, language: this.app.ui.locale },
        { token: Token.QTUM, status: OracleStatus.CREATED, language: this.app.ui.locale },
      ];
      const { oracles, pageInfo: { hasNextPage } } = await queryAllOracles(this.app, filters, orderBy, limit, skip);
      this.hasMore = hasNextPage;
      return _.orderBy(oracles, ['endTime'], this.sortBy.toLowerCase());
    }
    return INIT_VALUES.list;
  }
}
