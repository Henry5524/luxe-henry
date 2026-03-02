# Локальное тестирование и деплой на Vercel

## 1. Локальная разработка

### Запуск

```bash
# Установка зависимостей
npm i

# Запуск PostgreSQL (если через Docker)
# docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=luxe_launchpad postgres:16

# Миграции БД (читает .env.local)
npm run db:push
# или
npm run db:migrate

# Опционально: сиды
npm run db:seed

# Dev-сервер
npm run dev
```

Приложение будет на **http://localhost:3000**.

### Переменные окружения локально

Файл **`.env.local`** уже подключён: Next.js и скрипты Drizzle (`db:*`) автоматически подхватывают его.

- **База**: `DATABASE_URL` — локальный PostgreSQL.
- **Auth**: `AUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
- **GCP**: для загрузки картинок локально достаточно:
  - `GCP_BUCKET_NAME=preview_55`
  - Без ключа: выполнить `gcloud auth application-default login` и `gcloud config set project luxe-website-489006` — тогда используется ADC.

Переменные `GOOGLE_WORKLOAD_IDENTITY_*` и `GOOGLE_SERVICE_ACCOUNT` на локальной машине не нужны (они для Vercel).

---

## 2. Деплой на Vercel

### Подключение репозитория

1. Зайди в [vercel.com](https://vercel.com) → Add New → Project.
2. Импортируй репозиторий **luxe-henry** (GitHub/GitLab/Bitbucket).
3. Vercel подставит Framework Preset: **Next.js**. Оставь как есть и нажми Deploy (первый деплой может упасть без переменных — это нормально).

### Переменные окружения в Vercel

В проекте: **Settings → Environment Variables**. Добавь переменные для **Production** (и при необходимости Preview):

| Переменная | Описание | Пример |
|------------|----------|--------|
| `DATABASE_URL` | PostgreSQL на продакшене (Neon, Supabase, Railway и т.п.) | `postgresql://user:pass@host:5432/db` |
| `AUTH_SECRET` | Секрет для NextAuth (сгенерировать: `openssl rand -base64 32`) | длинная случайная строка |
| `ADMIN_EMAIL` | Email админа | тот же, что локально или новый |
| `ADMIN_PASSWORD` | Пароль админа | надёжный пароль |
| `GCP_BUCKET_NAME` | Имя bucket в GCP | `preview_55` |
| `GOOGLE_PROJECT_ID` | ID проекта GCP | `luxe-website-489006` |
| `GOOGLE_PROJECT_NUMBER` | Номер проекта | `847637556692` |
| `GOOGLE_WORKLOAD_IDENTITY_POOL` | Workload Identity Pool | `vercel-pool` |
| `GOOGLE_WORKLOAD_IDENTITY_PROVIDER` | Workload Identity Provider | `vercel-provider` |
| `GOOGLE_SERVICE_ACCOUNT` | Сервисный аккаунт | `vercel-backend@luxe-website-489006.iam.gserviceaccount.com` |

Важно: **`DATABASE_URL`** на Vercel должен указывать на облачную БД (не на `localhost`). Локальный `.env.local` в деплой не попадает.

### GCP на Vercel (загрузка в bucket)

Сейчас в коде используется `new Storage()` без ключа — т.е. ожидаются Application Default Credentials. На Vercel ADC по умолчанию нет, поэтому возможны два пути:

1. **Workload Identity Federation (OIDC)**  
   Настроить в GCP провайдер для Vercel и выдачу токенов для сервисного аккаунта. Тогда никакой JSON-ключ в Vercel хранить не нужно. Переменные `GOOGLE_*` из `.env.local` как раз для такой схемы — их нужно прописать в Vercel и убедиться, что в GCP настроен OIDC и привязка к этому сервисному аккаунту.

2. **Сервисный ключ в секретах**  
   Если в организации разрешено создавать ключи:
   - В GCP: IAM → Service Accounts → ключ для `vercel-backend@...` → JSON.
   - В Vercel: Environment Variables → `GOOGLE_APPLICATION_CREDENTIALS` = **вставить весь JSON одной строкой** (или положить в секрет и в коде при старте писать во временный файл и задавать путь в `GOOGLE_APPLICATION_CREDENTIALS`).

После добавления переменных сделай **Redeploy** проекта (Deployments → … → Redeploy).

---

## 3. Типичный цикл: локально → Vercel

1. Разработка и проверка локально:
   ```bash
   npm run dev
   ```
2. Коммит и пуш в ветку (например `main`):
   ```bash
   git add .
   git commit -m "feat: ..."
   git push origin main
   ```
3. Vercel сам соберёт и задеплоит по пушу (если включён Auto-Deploy). Или: вручную Deploy в панели Vercel.
4. Проверка на проде: зайди на `https://твой-проект.vercel.app`.

---

## 4. Полезные команды

```bash
# Локально: линт и сборка (как на Vercel)
npm run lint
npm run build
npm run start   # проверка production-сборки локально

# Drizzle: студия БД
npm run db:studio
```

Если что-то падает только на Vercel — смотри логи в **Vercel → Project → Deployments → выбранный деплой → Logs / Functions**.
