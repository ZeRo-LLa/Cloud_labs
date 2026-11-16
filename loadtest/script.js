// Навантажувальний тест для магазину болідів F1 (лабораторна 2, завдання 2).
// Профіль "мало записів, багато читань": на кожну 1 операцію запису припадає 9 читань.
//
// Параметри (змінні середовища):
//   BASE_URL  адреса ALB, наприклад http://f1-shop-alb-123.eu-north-1.elb.amazonaws.com
//   VUS       N: кількість віртуальних користувачів на сталому навантаженні (за замовчуванням 50)

import http from 'k6/http';
import { check, sleep, fail } from 'k6';

const BASE_URL = (__ENV.BASE_URL || '').replace(/\/$/, '');
const VUS = Number(__ENV.VUS || 50);
const ENGINES = ['Ferrari', 'Mercedes', 'Honda RBPT', 'Renault'];
const JSON_HEADERS = { headers: { 'Content-Type': 'application/json' } };

export const options = {
  // Три фази: наростання 2.5 хв, стале навантаження 5 хв, спад 2 хв
  stages: [
    { duration: '2m30s', target: VUS },
    { duration: '5m', target: VUS },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'], // менше 1% помилок
    http_req_duration: ['p(95)<1000'], // p95 швидше за 1 секунду
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(50)', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

// Виконується один раз перед тестом: перевіряє, що сервіс живий,
// і бере id болідів, які вже є в базі (щоб читати існуючі записи).
export function setup() {
  if (!BASE_URL) fail('Задай BASE_URL, наприклад: BASE_URL=http://... k6 run loadtest/script.js');

  const health = http.get(`${BASE_URL}/health`);
  if (health.status !== 200) fail(`/health повернув ${health.status}, тест не запускаю`);

  const list = http.get(`${BASE_URL}/products`);
  const seededIds = list
    .json()
    .filter((p) => !p.name.startsWith('LoadTest'))
    .map((p) => p.id);
  if (seededIds.length === 0) fail('У базі немає болідів для читання');
  return { seededIds };
}

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Одна ітерація = один віртуальний користувач: 1 запис + 9 читань (+ прибирання)
export default function (data) {
  // 1 запис: створюємо боліда
  const created = http.post(
    `${BASE_URL}/products`,
    JSON.stringify({
      name: `LoadTest ${__VU}-${__ITER}`,
      engine: pick(ENGINES),
      price: 1000000 + Math.floor(Math.random() * 1000000),
      description: 'created by k6 load test',
      image: '/assets/ferrari.jpg',
    }),
    JSON_HEADERS
  );
  const createdOk = check(created, { 'POST /products: 201': (r) => r.status === 201 });
  if (!createdOk) {
    sleep(1);
    return;
  }
  const newId = created.json('id');

  // 9 читань. Тег name групує адреси з різними id в одну метрику (інакше k6 створює
  // окрему метрику на кожен унікальний id і скаржиться на високу кардинальність).
  const byId = { tags: { name: 'GET /products/:id' } };
  const byEngine = { tags: { name: 'GET /products?engine=' } };
  const reads = [
    http.get(`${BASE_URL}/products`), // 1: список
    http.get(`${BASE_URL}/products/${newId}`, byId), // 2: щойно створений болід
    http.get(`${BASE_URL}/products/${pick(data.seededIds)}`, byId), // 3-5: існуючі боліди
    http.get(`${BASE_URL}/products/${pick(data.seededIds)}`, byId),
    http.get(`${BASE_URL}/products/${pick(data.seededIds)}`, byId),
    http.get(`${BASE_URL}/products?engine=${encodeURIComponent(pick(ENGINES))}`, byEngine), // 6-8: фільтр за двигуном
    http.get(`${BASE_URL}/products?engine=${encodeURIComponent(pick(ENGINES))}`, byEngine),
    http.get(`${BASE_URL}/products?engine=${encodeURIComponent(pick(ENGINES))}`, byEngine),
    http.get(`${BASE_URL}/products`), // 9: список ще раз
  ];
  for (const r of reads) {
    check(r, { 'GET: 200': (x) => x.status === 200 });
  }

  // Прибирання, щоб база не розросталась (це додаткова операція запису, окрім основної)
  http.del(`${BASE_URL}/products/${newId}`, null, {
    ...JSON_HEADERS,
    tags: { name: 'DELETE /products/:id' },
  });

  sleep(0.2); // коротка пауза між ітераціями
}
