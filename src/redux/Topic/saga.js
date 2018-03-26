import { all, takeEvery, put, fork, call } from 'redux-saga/effects';
import _ from 'lodash';

import actions from './actions';
import { request } from '../../network/httpRequest';
import { satoshiToDecimal } from '../../helpers/utility';
import Routes from '../../network/routes';

export function* getEventEscrowAmountHandler() {
  yield takeEvery(actions.GET_EVENT_ESCROW_AMOUNT, function* getEventEscrowAmountRequest(action) {
    try {
      const {
        senderAddress,
      } = action.params;

      const options = {
        method: 'POST',
        body: JSON.stringify({
          senderAddress,
        }),
        headers: { 'Content-Type': 'application/json' },
      };

      const result = yield call(request, Routes.api.eventEscrowAmount, options);
      const eventEscrowAmount = satoshiToDecimal(result[0]);

      yield put({
        type: actions.GET_EVENT_ESCROW_AMOUNT_RETURN,
        value: eventEscrowAmount,
      });
    } catch (err) {
      yield put({
        type: actions.GET_EVENT_ESCROW_AMOUNT_RETURN,
        error: {
          route: Routes.api.eventEscrowAmount,
          message: err.message,
        },
      });
    }
  });
}

export function* getBetAndVoteBalancesHandler() {
  yield takeEvery(actions.GET_BET_AND_VOTE_BALANCES, function* getBetAndVoteBalancesRequest(action) {
    try {
      const {
        contractAddress,
        senderAddress,
      } = action.params;

      const options = {
        method: 'POST',
        body: JSON.stringify({
          contractAddress,
          senderAddress,
        }),
        headers: { 'Content-Type': 'application/json' },
      };

      let result = yield call(request, Routes.api.betBalances, options);
      const bets = _.map(result[0], satoshiToDecimal);

      result = yield call(request, Routes.api.voteBalances, options);
      const votes = _.map(result[0], satoshiToDecimal);

      yield put({
        type: actions.GET_BET_VOTE_BALANCES_RETURN,
        value: {
          bets,
          votes,
        },
      });
    } catch (err) {
      yield put({
        type: actions.GET_BET_VOTE_BALANCES_RETURN,
        error: {
          route: `${Routes.api.betBalances} ${Routes.api.voteBalances}`,
          message: err.message,
        },
      });
    }
  });
}

export function* calculateWinningsHandler() {
  yield takeEvery(actions.CALCULATE_WINNINGS, function* calculateWinningsRequest(action) {
    try {
      const {
        contractAddress,
        walletAddresses,
      } = action.params;

      const value = [];
      for (let i = 0; i < walletAddresses.length; i++) {
        const item = walletAddresses[i];
        const senderAddress = item.address;
        const options = {
          method: 'POST',
          body: JSON.stringify({
            contractAddress,
            senderAddress,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        };

        const result = yield call(request, Routes.api.winnings, options);
        let botWon = 0;
        let qtumWon = 0;

        if (result) {
          botWon = satoshiToDecimal(result['0']);
          qtumWon = satoshiToDecimal(result['1']);
        }

        // return only winning addresses
        if (botWon || qtumWon) {
          value.push({ address: senderAddress, botWon, qtumWon });
        }
      }

      yield put({
        type: actions.CALCULATE_WINNINGS_RETURN,
        value,
      });
    } catch (err) {
      yield put({
        type: actions.CALCULATE_WINNINGS_RETURN,
        error: {
          route: Routes.api.winnings,
          message: err.message,
        },
      });
    }
  });
}

export default function* topicSaga() {
  yield all([
    fork(getEventEscrowAmountHandler),
    fork(getBetAndVoteBalancesHandler),
    fork(calculateWinningsHandler),
  ]);
}
