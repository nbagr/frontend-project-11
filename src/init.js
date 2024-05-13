import 'bootstrap';
import * as yup from 'yup';
import i18next from 'i18next';
import axios from 'axios';
import _ from 'lodash';

import watcher from './watchers.js';
import parse from './rss.js';
import resources from './locales/index.js';
import locale from './locales/locale.js';

const fetchingTimeout = 5000;

const addProxy = (url) => {
  const urlWithProxy = new URL('/get', 'https://allorigins.hexlet.app');
  urlWithProxy.searchParams.set('url', url);
  urlWithProxy.searchParams.set('disableCache', 'true');
  return urlWithProxy.toString();
};

const getLoadingProcessErrorType = (e) => {
  if (e.isParsingError) {
    return 'noRss';
  }
  if (e.isAxiosError) {
    return 'network';
  }
  return 'unknown';
};

const fetchNewPosts = (watchedState) => {
  const promises = watchedState.feeds.map((feed) => {
    const urlWithProxy = addProxy(feed.url);
    return axios.get(urlWithProxy)
      .then((response) => {
        const feedData = parse(response.data.contents);
        const newPosts = feedData.items.map((item) => ({ ...item, channelId: feed.id }));
        const oldPosts = watchedState.posts.filter((post) => post.channelId === feed.id);
        const posts = _.differenceWith(newPosts, oldPosts, (p1, p2) => p1.title === p2.title)
          .map((post) => ({ ...post, id: _.uniqueId() }));
        watchedState.posts.unshift(...posts);
      })
      .catch((e) => {
        console.error(e);
      });
  });
  Promise.all(promises).finally(() => {
    setTimeout(() => fetchNewPosts(watchedState), fetchingTimeout);
  });
};

const loadRss = (watchedState, url) => {
  watchedState.loadingProcess.status = 'loading';
  const urlWithProxy = addProxy(url);
  return axios.get(urlWithProxy)
    .then((response) => {
      const data = parse(response.data.contents);
      const feed = {
        url, id: _.uniqueId(), title: data.title, description: data.descrpition,
      };
      const posts = data.items.map((item) => ({ ...item, channelId: feed.id, id: _.uniqueId() }));
      watchedState.posts.unshift(...posts);
      watchedState.feeds.unshift(feed);

      watchedState.loadingProcess.error = null;
      watchedState.loadingProcess.status = 'idle';
      watchedState.form = {
        ...watchedState.form,
        status: 'filling',
        error: null,
      };
    })
    .catch((e) => {
      console.log(e);
      watchedState.loadingProcess.error = getLoadingProcessErrorType(e);
      watchedState.loadingProcess.status = 'failed';
    });
};

export default () => {
  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.rss-form input'),
    feedback: document.querySelector('.feedback'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedsBox: document.querySelector('.feeds'),
    postsBox: document.querySelector('.posts'),
    modal: document.querySelector('#modal'),
  };

  const initState = {
    feeds: [],
    posts: [],
    loadingProcess: {
      status: 'idle',
      error: null,
    },
    form: {
      error: null,
      valid: false,
      status: 'filling',
    },
    modal: {
      postId: null,
    },
    ui: {
      seenPosts: new Set(),
    },
  };

  const i18nextInstance = i18next.createInstance();

  const promise = i18nextInstance.init({
    lng: 'ru',
    resources,
  })
    .then(() => {
      yup.setLocale(locale);
      const validateUrl = (url, feeds) => {
        const feedUrl = feeds.map((feed) => feed.url);
        const schema = yup.string().url().required().notOneOf(feedUrl);

        return schema.validate(url)
          .then(() => null)
          .catch((error) => error.message);
      };

      const watchedState = watcher(initState, elements, i18nextInstance);

      elements.form.addEventListener('submit', (event) => {
        event.preventDefault();
        const data = new FormData(event.target);
        const url = data.get('url');

        validateUrl(url, watchedState.feeds)
          .then((error) => {
            if (!error) {
              watchedState.form = {
                ...watchedState.form,
                error: null,
                valid: true,
              };
              loadRss(watchedState, url);
            } else {
              watchedState.form = {
                ...watchedState.form,
                error: error.key,
                valid: false,
              };
            }
          });
      });

      elements.postsBox.addEventListener('click', (evt) => {
        if (!('id' in evt.target.dataset)) {
          return;
        }

        const { id } = evt.target.dataset;
        watchedState.modal.postId = String(id);
        watchedState.ui.seenPosts.add(id);
      });

      setTimeout(() => fetchNewPosts(watchedState), fetchingTimeout);
    });

  return promise;
};
