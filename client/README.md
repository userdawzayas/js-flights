# Client

## Deploying to Render

Create a Render Static Site with:

- Root Directory: `client`
- Build Command: `npm ci --include=dev && NODE_ENV=production npm run build`
- Publish Directory: `dist`

Set `API_BASE_URL` to the backend's public URL, for example
`https://<backend-name>.onrender.com`. The production build fails if this
variable is missing or is not a valid HTTP(S) URL. The URL is public client
configuration, not a secret.

For local builds, `API_BASE_URL` is optional and defaults to
`http://localhost:3000`.
