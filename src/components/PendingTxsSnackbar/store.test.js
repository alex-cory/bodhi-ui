import { TransactionType, TransactionStatus } from 'constants';
import PendingTxsSnackbarStore from './store';
import { mockResetTransactionList, mockAddTransaction } from '../../network/graphql/queries/';

jest.mock('../../network/graphql/queries'); // block and manually mock our backend

describe('PendingTxsSnackbarStore', () => {
  let store;
  const addr = {
    address: 'qSu4uU8MGp2Ya6j9kQZAtizUfC82aCvGT1',
    qtum: 2000,
    bot: 100,
  };
  const app = {
    sortBy: 'ASC',
    wallet: { addresses: [addr] },
    global: { syncBlockNum: 0, syncPercent: 10 },
    refreshing: false,
    ui: { location: 0 },
  }; // mock the appstore
  beforeEach(() => {
    store = new PendingTxsSnackbarStore(app); // create a new instance before each test case
    mockResetTransactionList();
  });

  /** all following test cases target specifically to the mock backend, eg. network/graphql/__mocks__/queries.js */
  it('Init with null tx list', async () => {
    expect.assertions(2);
    await store.init();
    expect(store.count).toBe(0);
    expect(store.isVisible).toBe(false);
  });

  it('reaction visible', async () => {
    expect(store.isVisible).toBe(false);
    mockAddTransaction({ txid: 1, status: TransactionStatus.PENDING, type: TransactionType.APPROVE_CREATE_EVENT });
    await store.queryPendingTransactions();
    setTimeout(() => {
      expect(store.isVisible).toBe(true);
    }, 500);
    mockResetTransactionList();
    await store.queryPendingTransactions();
    setTimeout(() => {
      expect(store.isVisible).toBe(false);
    }, 500);
  });

  it('reaction sync', async () => {
    expect(store.isVisible).toBe(false);
    mockAddTransaction({ txid: 1, status: TransactionStatus.PENDING, type: TransactionType.APPROVE_CREATE_EVENT });
    app.global.syncBlockNum = 1;
    setTimeout(() => {
      expect(store.isVisible).toBe(false);
    }, 500);
    app.global.syncPercent = 120;
    setTimeout(() => {
      expect(store.isVisible).toBe(false);
    }, 500);
    app.global.syncBlockNum = 2;
    setTimeout(() => {
      expect(store.isVisible).toBe(true);
    }, 500);
    mockResetTransactionList();
    app.global.syncPercent = 150;
    setTimeout(() => {
      expect(store.isVisible).toBe(true);
    }, 500);
    app.global.syncBlockNum = 3;
    setTimeout(() => {
      expect(store.isVisible).toBe(false);
    }, 500);
  });

  it('Init with tx list', async () => {
    await store.queryPendingTransactions();
    expect(store.count).toBe(0);
    expect(store.isVisible).toBe(false);
    mockAddTransaction({ txid: 1, status: TransactionStatus.PENDING, type: TransactionType.APPROVE_CREATE_EVENT });
    await store.queryPendingTransactions();
    expect(store.count).toBe(1);
    expect(store.pendingCreateEvents.length).toBe(1);
    expect(store.isVisible).toBe(true);
    mockAddTransaction({ txid: 2, status: TransactionStatus.PENDING, type: TransactionType.CREATE_EVENT });
    await store.queryPendingTransactions();
    expect(store.count).toBe(2);
    expect(store.pendingCreateEvents.length).toBe(2);
    expect(store.isVisible).toBe(true);
    mockAddTransaction({ txid: 3, status: TransactionStatus.PENDING, type: TransactionType.BET });
    await store.queryPendingTransactions();
    expect(store.count).toBe(3);
    expect(store.pendingCreateEvents.length).toBe(2);
    expect(store.pendingBets.length).toBe(1);
    expect(store.isVisible).toBe(true);
    mockResetTransactionList();
    await store.queryPendingTransactions();
    expect(store.count).toBe(0);
    expect(store.pendingCreateEvents.length).toBe(0);
    expect(store.pendingBets.length).toBe(0);
    expect(store.isVisible).toBe(false);
    mockAddTransaction({ txid: 4, status: TransactionStatus.PENDING, type: TransactionType.SET_RESULT });
    await store.queryPendingTransactions();
    expect(store.count).toBe(1);
    expect(store.pendingCreateEvents.length).toBe(0);
    expect(store.pendingSetResults.length).toBe(1);
    expect(store.isVisible).toBe(true);
  });
});
