export default {
  string: {
    url: () => ({ key: 'notUrl' }),
  },
  mixed: {
    required: () => ({ key: 'empty' }),
    notOneOf: () => ({ key: 'exists' }),
  },
};
