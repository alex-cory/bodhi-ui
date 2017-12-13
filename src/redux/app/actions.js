export function getView(width) {
  let newView = 'MobileView';
  if (width > 1220) {
    newView = 'DesktopView';
  } else if (width > 767) {
    newView = 'TabView';
  }
  return newView;
}

const actions = {
  COLLPSE_CHANGE: 'COLLPSE_CHANGE',
  COLLPSE_OPEN_DRAWER: 'COLLPSE_OPEN_DRAWER',
  CHANGE_OPEN_KEYS: 'CHANGE_OPEN_KEYS',
  TOGGLE_ALL: 'TOGGLE_ALL',
  CHANGE_CURRENT: 'CHANGE_CURRENT',
  ADD_WALLET_ADDRESS: 'ADD_WALLET_ADDRESS',
  SELECT_WALLET_ADDRESS: 'SELECT_WALLET_ADDRESS',
  toggleCollapsed: () => ({
    type: actions.COLLPSE_CHANGE,
  }),
  toggleAll: (width, height) => {
    const view = getView(width);
    const collapsed = view !== 'DesktopView';
    return {
      type: actions.TOGGLE_ALL,
      collapsed,
      view,
      height,
    };
  },
  toggleOpenDrawer: () => ({
    type: actions.COLLPSE_OPEN_DRAWER,
  }),
  changeOpenKeys: (openKeys) => ({
    type: actions.CHANGE_OPEN_KEYS,
    openKeys,
  }),
  changeCurrent: (current) => ({
    type: actions.CHANGE_CURRENT,
    current,
  }),
  addWalletAddress: (value) => {
    console.log(`actions: ${value}`);
    return {
      type: actions.ADD_WALLET_ADDRESS,
      value,
    };
  },
  selectWalletAddress: (value) => {
    console.log(`selectWalletAddress actions: ${value}`);

    return {
      type: actions.SELECT_WALLET_ADDRESS,
      value,
    };
  },
};
export default actions;
