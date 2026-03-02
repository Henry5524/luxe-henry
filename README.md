# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## GCP Cloud Storage (image uploads)

Bucket: **preview_55**, Project: **luxe-website-489006**

В организации может быть включена политика **iam.disableServiceAccountKeyCreation** — создание ключей сервисного аккаунта запрещено. Используй **Application Default Credentials** (без JSON-ключа).

### 1. Локальная разработка (без ключа)

1. Установи [Google Cloud SDK (gcloud)](https://cloud.google.com/sdk/docs/install).
2. В терминале выполни:
   ```bash
   gcloud auth application-default login
   ```
   Войди в аккаунт Google с доступом к проекту **luxe-website-489006** и bucket **preview_55**.
3. Убедись, что выбран нужный проект:
   ```bash
   gcloud config set project luxe-website-489006
   ```
4. В **`.env.local`** укажи только bucket (путь к ключу не нужен):
   ```env
   GCP_BUCKET_NAME="preview_55"
   ```
   Переменную `GOOGLE_APPLICATION_CREDENTIALS` не задавай — библиотека возьмёт учётные данные из `gcloud auth application-default login`.

Твой пользовательский аккаунт должен иметь права на запись в bucket (например роль **Storage Object Admin** на проект или на bucket).

### 2. Прод (деплой на сервере)

- **Если приложение крутится на GCP** (Cloud Run, GKE, GCE): привяжи к сервису Service Account с ролью **Storage Object Admin** — ключ не нужен, используются встроенные учётные данные.
- **Если деплой не на GCP** (Vercel, свой VPS и т.д.): без ключа варианты — [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation) (OIDC) или запрос к администратору организации на снятие ограничения `iam.disableServiceAccountKeyCreation` для создания одного ключа (хранить в секретах окружения).

### 3. Публичный доступ к картинкам

Сейчас bucket **Not public**. Чтобы ссылки на картинки открывались без подписи:

- **Вариант A:** [Bucket → Permissions](https://console.cloud.google.com/storage/browser/preview_55?project=luxe-website-489006) → Add principal → `allUsers` → роль **Storage Object Viewer** (публичное чтение).
- **Вариант B:** оставить bucket приватным и позже включить в коде [signed URLs](https://cloud.google.com/storage/docs/access-control/signed-urls).

После этого загрузка/удаление в админке будут идти в bucket **preview_55**.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
