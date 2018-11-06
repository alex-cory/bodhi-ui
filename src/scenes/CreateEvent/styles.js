const styles = (theme) => ({
  createDialog: {
    overflow: 'auto',
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  createDialogPaper: {
    overflow: 'auto',
    [theme.breakpoints.down('xs')]: {
      margin: 0,
    },
  },
  createDialogTitle: {
    padding: `${theme.padding.space2X.px} ${theme.padding.space3X.px} 0 ${theme.padding.space3X.px}`,
  },
  escrowAmountNote: {
    margin: `${theme.padding.space3X.px} 0 0 0`,
  },
  createEventTextField: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
    height: 'auto',
  },
  createEventInputAdornment: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
      paddingTop: 8,
    },
  },
  removeOutcomeIcon: {
    position: 'absolute',
    right: 5,
    top: 8,
    cursor: 'pointer',
  },
  addOutcomeButton: {
    marginTop: theme.padding.spaceX.px,
  },
  selectAddressButton: {
    marginBottom: theme.padding.spaceX.px,
  },
  selectAddressButtonContent: {
    padding: '0px',
  },
  footer: {
    margin: theme.padding.space3X.px,
  },
  buttonIcon: {
    fontSize: theme.sizes.icon.small,
    marginRight: 4,
  },
  cancelButton: {
    marginRight: theme.padding.spaceX.px,
  },
  root: {
    borderRadius: '5px',
    width: '50%',
    marginLeft: '20px',
    '&$disabled': {
      color: 'black',
    },
  },
  disabled: {},
  formControl: {
    width: '50%',
  },
  firstDateItem: {
    [theme.breakpoints.up('sm')]: {
      paddingRight: theme.padding.spaceX.px,
    },
  },
});

export default styles;
