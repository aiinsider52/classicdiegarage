const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => nav.classList.remove('open')));

document.querySelectorAll('.faq button').forEach(button => {
  button.addEventListener('click', () => {
    const answer = button.nextElementSibling;
    const open = answer.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.querySelector('b').textContent = open ? '−' : '+';
  });
});

const progress = document.querySelector('.scroll-progress');
addEventListener('scroll', () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress.style.setProperty('--scroll', `${max ? (scrollY / max) * 100 : 0}%`);
}, { passive: true });

if (!reduceMotion) {
  const hero = document.querySelector('.hero');
  hero.addEventListener('pointermove', event => {
    const rect = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width - .5) * 18}px`);
    hero.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height - .5) * 12}px`);
  });
  hero.addEventListener('pointerleave', () => {
    hero.style.setProperty('--mx', '0px');
    hero.style.setProperty('--my', '0px');
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
}

const runButton = document.querySelector('.run-demo');
const workflowSteps = [...document.querySelectorAll('.workflow-step')];
const processedMetric = document.querySelector('.dash-metrics div:first-child strong');
runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  runButton.textContent = 'Процесс выполняется';
  workflowSteps.forEach(step => {
    step.classList.remove('active', 'done');
    step.querySelector('i').textContent = 'ожидает';
  });
  for (const step of workflowSteps) {
    step.classList.add('active');
    step.querySelector('i').textContent = 'в работе';
    await new Promise(resolve => setTimeout(resolve, reduceMotion ? 50 : 650));
    step.classList.remove('active');
    step.classList.add('done');
    step.querySelector('i').textContent = 'готово ✓';
  }
  processedMetric.textContent = '2,848';
  runButton.disabled = false;
  runButton.textContent = 'Запустить снова';
});

const form = document.querySelector('.contact-form');
const submitButton = form.querySelector('.submit-button');
const status = form.querySelector('.form-status');
form.addEventListener('submit', async event => {
  event.preventDefault();
  let valid = true;
  form.querySelectorAll('input, textarea').forEach(field => {
    const error = field.parentElement.querySelector('.field-error');
    if (!field.validity.valid) {
      error.textContent = field.type === 'email' ? 'Введите рабочий email.' : 'Опишите задачу минимум в 12 символах.';
      valid = false;
    } else {
      error.textContent = '';
    }
  });
  if (!valid) return;
  submitButton.disabled = true;
  submitButton.textContent = 'Отправляем…';
  status.textContent = 'Формируем запрос на консультацию.';
  await new Promise(resolve => setTimeout(resolve, reduceMotion ? 100 : 900));
  form.classList.add('success');
  status.textContent = 'Запрос принят. Свяжемся в течение рабочего дня.';
  submitButton.textContent = 'Запрос отправлен ✓';
  form.reset();
});
