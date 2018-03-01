import { Map } from 'immutable';
import actions from './actions';

const initState = new Map({
  type: 'toggled',
  value: false,
});

export default function stateReducer(state = initState, action) {
  switch (action.type) {
    case actions.EDITING_TOGGLED: {
      return state.set('toggled', true);
    }
    case actions.CLEAR_EDITING_TOGGLED: {
      return state.set('toggled', false);
    }
    case actions.CALCULATE_WINNINGS_RETURN: {
      return state.set('calculate_bot_winnings_return', action.value.botWon)
        .set('calculate_qtum_winnings_return', action.value.qtumWon);
    }
    default: {
      return state;
    }
  }
}