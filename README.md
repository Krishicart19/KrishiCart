# KrishiCart mobile frontend

This is the first frontend for an agricultural-products shopping app. It is built with **Expo**, **React Native**, and **TypeScript**, so one codebase can run on Android, iOS, and the web.

## What is included now

- A home product catalog with sample agricultural products
- Search and category filtering
- Product details
- A local cart with quantity controls and total calculation
- A simple profile placeholder

The products are currently mock data in `src/data/catalog.ts`. There is no backend, login, or real payment integration yet.

## Folder guide

```text
App.tsx                 Main app and screen state (start reading here)
src/data/catalog.ts     Temporary product/category data
src/types/catalog.ts    TypeScript shapes for products and cart items
src/components/         Reusable UI pieces
```

## Run it locally

1. Install **Node.js LTS** from [nodejs.org](https://nodejs.org/). Close and reopen PowerShell afterwards.
2. In this folder, run `npm install`.
3. Run `npm start`.
4. Install **Expo Go** on your Android/iPhone, then scan the QR code shown in the terminal.

You can also press `w` after starting Expo to see the web version in a browser.

> If PowerShell says it cannot find `npm-cli.js`, your Node/npm installation is incomplete. Reinstall the current Node.js **LTS** release, reopen PowerShell, and then retry the two commands above.

## Your next learning step

Build the login and registration screens next. After that, we can separate the current `App.tsx` into dedicated screen files and connect the UI to a real ASP.NET Core API.
