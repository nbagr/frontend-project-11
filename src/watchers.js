import onChange from 'on-change';

export default (initState, elements, i18next) => {
  const handleForm = () => {
    const { form: { error, valid } } = initState;
    const { input, feedback } = elements;

    if (valid) {
      input.classList.remove('is-invalid');
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18next.t(`errors.${error}`);
    }
  };

  const watchedState = onChange(initState, (path) => {
    switch (path) {
      case 'form':
        handleForm();
        break;
      default:
        break;
    }
  });

  return watchedState;
};
