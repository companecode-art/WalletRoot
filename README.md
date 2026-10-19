# RootWallet

RootWallet — премиальный криптокошелёк в формате Telegram Mini App: мультивалютные счета, пополнение, отправка, история, живой Crypto Pulse и коллекционные награды.

> Это рабочий демо-прототип. Приложение не хранит реальные приватные ключи, не подписывает транзакции, не подключается к блокчейнам и не работает с настоящими активами. Все балансы, адреса, курсы и операции синтетические.

## Что реализовано

- Онбординг с BIP39 seed-фразой, проверкой двух слов и PIN из четырёх цифр.
- PBKDF2-SHA256 хеширование PIN и локальный флаг эмуляции биометрии.
- Кошелёк с USDT (TRC-20), TON и BTC, общим портфелем в RUB/USDT и демо-курсами.
- Пополнение: QR-код, копирование адреса, payment URI и симуляция входящего зачисления.
- Отправка: валидация адреса и баланса, три уровня комиссии, Face ID/PIN, pending → confirmed.
- История: фильтры, сводка, детали операции, копирование хэша и адреса, статусы.
- Crypto Pulse: интерактивный график, live-обновления и рыночные метрики.
- Secret Box на девять ячеек, кулдаун 30 секунд, демо-токены и NFT-бейджи.
- Gas Saver с рекомендацией окна низких комиссий.
- Темы `black` и `matrix` с анимированным фоном.
- Смена PIN, биометрия, display currency, смена темы и полный сброс кошелька.
- Telegram SDK: user, haptics, header/background colors; безопасный web fallback.
- Адаптация под мобильные viewport, safe-area и bottom sheets.

## Стек

- React 18
- TypeScript 5.6
- Vite 5.4
- Tailwind CSS 3.4
- Recharts
- `qrcode.react`
- `@scure/bip39`, `@noble/hashes`
- `lucide-react`
- Fontsource: Inter, JetBrains Mono

## Быстрый старт

Требования: Node.js 20+ и npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Откройте `http://localhost:5173`.

В PowerShell с ограниченной Execution Policy используйте `npm.cmd` и `npx.cmd`. В обычном терминале macOS/Linux достаточно `npm`.

### Сборка и проверка

```powershell
npm.cmd run typecheck
npm.cmd run build
npm.cmd run preview
```

Production-сборка находится в `dist/`. Vite использует `base: './'`, поэтому статический билд можно размещать в подкаталоге.

## Разработка через туннель

Telegram открывает Mini App только по HTTPS, поэтому для локальной разработки нужен публичный туннель. Скрипт `scripts/dev-telegram.mjs` автоматизирует весь цикл:

1. запускает Vite dev server с `strictPort`;
2. поднимает `cloudflared` или `ngrok`;
3. получает актуальный публичный URL;
4. обновляет default menu button бота через `setChatMenuButton`;
5. при указанном `TELEGRAM_CHAT_ID` создаёт или редактирует закреплённое сообщение с кнопкой `web_app`, чтобы старые кнопки не вели на устаревший URL.

```powershell
Copy-Item .env.example .env
notepad .env
npm.cmd run dev:tunnel
```

Установка cloudflared в Windows:

```powershell
winget install --id Cloudflare.cloudflared -e
```

Установка ngrok и запуск через него:

```powershell
winget install --id Ngrok.Ngrok -e
npm.cmd run dev:tunnel -- --tunnel ngrok
```

Если туннель уже запущен вручную, используйте готовый URL:

```powershell
npm.cmd run dev:tunnel:external -- --url https://example.trycloudflare.com
```

Флаги: `--port`, `--no-server`, `--no-telegram`, `--dry-run`, `--help`.

Настройки читаются из `.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_PIN_MESSAGE`, `TUNNEL_PROVIDER`, `TELEGRAM_WEBAPP_URL`, `DEV_PORT`. Файл `.env` и `.telegram-dev.json` не коммитятся. Токен бота используется только локальным скриптом и никогда не попадает в клиентский bundle.

Важно: Bot API умеет менять menu button, inline web_app кнопки и сообщения бота, но не умеет менять Main Mini App, настроенный в BotFather. Если используется именно Main Mini App, его URL при смене туннеля нужно обновлять в BotFather вручную.

## Демо-прохождение

1. Нажмите «Создать кошелёк».
2. Запишите 12 слов и подтвердите показ.
3. Введите два запрошенных слова.
4. Задайте PIN из четырёх цифр и повторите его.
5. На главном экране попробуйте пополнение, отправку и «Новый счёт».
6. Откройте Pulse и переключите актив.
7. На вкладке «Бонусы» откройте Secret Box.
8. В настройках смените тему, валюту и PIN.

Для повторного прохождения: Настройки → «Сбросить кошелёк» → «Сбросить». Либо очистите `localStorage` в DevTools.

Демо-PIN, заданный при онбординге, никуда не передаётся. Используйте только тестовые данные.

## Хранение данных

Профиль хранится локально под ключом `rootwallet.profile.v1`:

- версия профиля, seed fingerprint и логин;
- PBKDF2 hash PIN и соль;
- настройки темы, валюты и биометрии;
- счета, демо-транзакции и бейджи;
- время последнего открытия Secret Box.

Seed-фраза не сохраняется. Приложение не содержит реальных ключей, bot token или платёжных секретов.

## Архитектура

```text
src/
  App.tsx              shell, splash, tabs, sheet router
  main.tsx             bootstrap и Telegram init
  types.ts             доменные типы
  components/
    ui/                Button, Sheet, Toasts, PinPad и др.
    onboarding/        создание кошелька
    screens/           Wallet, History, Pulse, Bonus
    flows/             Deposit, Send, Settings, TxDetail, CreateAccount
    wallet/            карточки, список счетов, промо
    bonus/             Secret Box, Gas Saver, бейджи
  lib/                 crypto, address, format, market, gas, rewards
  services/            RootWalletApi и LocalWalletApi
  state/               AppContext
  telegram/            адаптер Telegram SDK
docs/
  SPEC.md              подробное ТЗ и production-требования
```

Поток данных:

```text
UI → AppContext → RootWalletApi → LocalWalletApi → localStorage
```

`RootWalletApi` намеренно отделён от UI. Для подключения backend достаточно реализовать интерфейс из `src/services/api.ts` и заменить `LocalWalletApi` на HTTP-клиент. Серверные требования, схема API и security checklist описаны в [docs/SPEC.md](docs/SPEC.md).

## Telegram Mini App

1. Соберите проект и разместите `dist/` на HTTPS-домене.
2. Создайте Mini App через BotFather и укажите URL.
3. Добавьте Mini App в menu button или отправьте кнопку открытия.
4. Проверьте на iOS и Android: safe-area, клавиатуру, нижнюю навигацию и haptics.

Токен бота нельзя хранить во frontend, репозитории или переменных `VITE_*`. Он должен находиться только на сервере в secret manager. Если токен попал в переписку или публичный канал, его следует отозвать через BotFather и выпустить новый.

В production сервер обязан проверять Telegram `initData` и быть единственным источником балансов, комиссий и статусов операций.

## Тестирование

В проекте нет отдельного unit/E2E-пакета. Проверки прототипа:

- `npm.cmd run typecheck` — без ошибок.
- `npm.cmd run build` — production build собирается.
- Визуальный E2E-прогон в Chromium на viewport 430 × 932: онбординг, пополнение, отправка через Face ID и PIN, pending → confirmed, история, Pulse, Secret Box, темы, создание счёта и сброс.
- Проверка отсутствия горизонтального overflow и перекрытия CTA toast-уведомлениями.

Ручные тест-кейсы и критерии приёмки перечислены в `docs/SPEC.md`.

## Ограничения демо

- Нет backend, авторизации и проверки Telegram `initData`.
- Нет реальных блокчейн-сетей, ключей и подписей.
- Адреса derivation — демонстрационная и не является HD-кошельком.
- Биометрия — эмуляция, а не WebAuthn.
- Курсы, комиссии и market feed синтетические.
- PIN можно перебрать при доступе к localStorage; rate limiting отсутствует.
- Баланс и историю можно изменить через DevTools.
- `localStorage` не является защищённым хранилищем.

Не используйте приложение для реальных средств. Production-требования: custody-модель, аппаратное хранение ключей, серверная валидация, AML/KYC, аудит и пентест.

## Roadmap

1. Telegram auth и backend API.
2. Серверные счета, идемпотентные переводы и мониторинг сетей.
3. Реальный market feed, SSE/WebSocket и уведомления.
4. Custody-модель, ключи, compliance и безопасность.
5. Пентест, аудит и production rollout.

Подробности — в `docs/SPEC.md`.
