const styles = (theme) => ({
  dashboardActionsWrapper: {
    marginBottom: theme.padding.space3X.px,
  },
  createEventButton: {
    padding: `12px ${theme.padding.space3X.px}`,
    verticalAlign: 'middle',
  },
  createEventButtonIcon: {
    [theme.breakpoints.down('xs')]: {
      fontSize: theme.sizes.font.textMd,
    },
  },
  dashboardActionsRight: {
    textAlign: 'right',
  },
  dashboardActionsSort: {
    display: 'inline-block',
    padding: `${theme.padding.spaceX.px} ${theme.padding.space3X.px}`,
    verticalAlign: 'middle',
    [theme.breakpoints.down('xs')]: {
      padding: `${theme.padding.spaceX.px} ${theme.padding.spaceX.px}`,
    },
  },
  dashboardActionsSortLabel: {
    marginRight: theme.padding.space3X.px,
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
      marginRight: theme.padding.spaceX.px,
    },
  },
  dashboardActionsSelect: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
  dashboardActionsMenuItem: {
    [theme.breakpoints.down('xs')]: {
      fontSize: 12,
    },
  },
});

export default styles;
