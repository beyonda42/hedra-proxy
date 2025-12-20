# Hedra API Proxy

A simple CORS proxy for the Hedra API, designed to be deployed on Vercel.

## What it does

- Forwards requests to `api.hedra.com`
- Adds CORS headers so browsers can make requests
- Handles file uploads (multipart/form-data)
- Passes your API key securely

## Setup

1. Fork or clone this repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "Add New Project"
4. Import this repository
5. Click "Deploy"
6. Copy your new deployment URL

## Usage

Your proxy URL will be something like:
```
https://your-project-name.vercel.app/api/hedra
```

Use it in your dashboard settings as the "Hedra Proxy URL".

All requests to `/api/hedra/*` will be forwarded to `api.hedra.com/web-app/public/*`

## Example

Request to:
```
https://your-project.vercel.app/api/hedra/models
```

Gets forwarded to:
```
https://api.hedra.com/web-app/public/models
```
