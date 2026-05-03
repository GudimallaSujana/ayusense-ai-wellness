# Ayusense

Ayusense is an AI-assisted Ayurvedic wellness platform for plant detection, herbal remedy guidance, and symptom-based support.

## Overview

This repository contains the Ayusense web application and Supabase serverless functions used for:

- Medicinal plant identification from images
- Ayurvedic remedy recommendations based on symptoms
- Personalized wellness insights with a plant-based focus

## Getting started

### Install dependencies

```sh
npm install
```

### Run the development server

```sh
npm run dev
```

### Build for production

```sh
npm run build
```

### Run tests

```sh
npm test
```

## Project structure

- `src/` — React application source files
- `src/components/` — UI views and reusable components
- `src/lib/` — API helpers and utility logic
- `supabase/functions/` — serverless functions for plant identification and remedy generation

## Notes

- Update environment variables for your AI gateway service in Supabase function settings.
- Remove or replace placeholder images with your own branded imagery before launch.

## License

This project is delivered as-is for Ayusense.
