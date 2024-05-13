import onChange from 'on-change';

export default (initState, elements, i18next) => {
  const handleForm = (state) => {
    const { form: { error, valid } } = state;
    const { input, feedback } = elements;

    if (valid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18next.t([`errors.${error}`, 'errors.unknown']);
    }
  };

  const handleLoadingProcessStatus = (state) => {
    const { loadingProcess } = state;
    const { submit, input, feedback } = elements;

    switch (loadingProcess.status) {
      case 'failed':
        submit.disabled = false;
        input.removeAttribute('readonly');
        feedback.classList.add('text-danger');
        feedback.textContent = i18next.t([`errors.${loadingProcess.error}`, 'errors.unknown']);
        break;
      case 'idle':
        submit.disabled = false;
        input.removeAttribute('readonly');
        input.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18next.t('loading.success');

        input.focus();
        break;
      case 'loading':
        submit.disabled = true;
        input.setAttribute('readonly', true);
        feedback.classList.remove('text-success');
        feedback.classList.remove('text-danger');
        feedback.textContent = '';
        break;
      default:
        throw new Error(`Unknown loadingProcess status: '${loadingProcess.status}'`);
    }
  };

  const handleFeeds = (state) => {
    const { feeds } = state;
    const { feedsBox } = elements;

    const fragmentStructure = document.createElement('div');
    fragmentStructure.classList.add('card', 'border-0');
    fragmentStructure.innerHTML = `
      <div class='card-body'></div>
    `;

    const feedsTitle = document.createElement('h2');
    feedsTitle.classList.add('card-title', 'h4');
    feedsTitle.textContent = i18next.t('feeds');
    fragmentStructure.querySelector('.card-body').appendChild(feedsTitle);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');

    const feedsListItems = feeds.map((feed) => {
      const element = document.createElement('li');
      element.classList.add('list-group-item', 'border-0', 'border-end-0');
      const title = document.createElement('h3');
      title.classList.add('h6', 'm-0');
      title.textContent = feed.title;
      const description = document.createElement('p');
      description.classList.add('m-0', 'small', 'text-black-50');
      description.textContent = feed.description;
      element.append(title, description);
      return element;
    });

    feedsList.append(...feedsListItems);
    fragmentStructure.appendChild(feedsList);
    feedsBox.innerHTML = '';
    feedsBox.appendChild(fragmentStructure);
  };

  const handlePosts = (state) => {
    const { posts, ui } = state;
    const { postsBox } = elements;

    const fragmentStructure = document.createElement('div');
    fragmentStructure.classList.add('card', 'border-0');
    fragmentStructure.innerHTML = `
      <div class='card-body'></div>
    `;

    const postsTitle = document.createElement('h2');
    postsTitle.classList.add('card-title', 'h4');
    postsTitle.textContent = i18next.t('posts');
    fragmentStructure.querySelector('.card-body').appendChild(postsTitle);

    const postsList = document.createElement('ul');
    postsList.classList.add('list-group', 'border-0', 'rounded-0');

    const postsListItems = posts.map((post) => {
      const element = document.createElement('li');
      element.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-start', 'border-0', 'border-end-0');
      const link = document.createElement('a');
      link.setAttribute('href', post.link);
      const className = ui.seenPosts.has(post.id) ? ['fw-normal', 'link-secondary'] : ['fw-bold'];
      link.classList.add(...className);
      link.dataset.id = post.id;
      link.textContent = post.title;
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
      element.appendChild(link);
      const button = document.createElement('button');
      button.setAttribute('type', 'button');
      button.classList.add('btn', 'btn-outline-primary', 'btn-sm');
      button.dataset.id = post.id;
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = i18next.t('view');
      element.appendChild(button);
      return element;
    });

    postsList.append(...postsListItems);
    fragmentStructure.appendChild(postsList);
    postsBox.innerHTML = '';
    postsBox.appendChild(fragmentStructure);
  };

  const handleModal = (state) => {
    const post = state.posts.find(({ id }) => id === state.modal.postId);
    const title = elements.modal.querySelector('.modal-title');
    const body = elements.modal.querySelector('.modal-body');
    const fullArticleBtn = elements.modal.querySelector('.full-article');

    title.textContent = post.title;
    body.textContent = post.description;
    fullArticleBtn.href = post.link;
  };

  const watchedState = onChange(initState, (path) => {
    switch (path) {
      case 'form':
        handleForm(initState);
        break;
      case 'loadingProcess.status':
        handleLoadingProcessStatus(initState);
        break;
      case 'feeds':
        handleFeeds(initState);
        break;
      case 'posts':
        handlePosts(initState);
        break;
      case 'modal.postId':
        handleModal(initState);
        break;
      case 'ui.seenPosts':
        handlePosts(initState);
        break;
      default:
        break;
    }
  });

  return watchedState;
};
