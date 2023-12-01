# bedhost-ui

This repository contains the source files for bedhost user interface written in React and built with Vite.

## Development

1. Make sure bedhost FastAPI server is running at port 8000
2. Install node module dependencies defined in `package.json`

```
npm install
```

3. Start development server on port 3000 by running the start react script (defined in `package.json`).

```
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

You can then develop the app by editing the source in the `/src` subfolder. Changes made in `./src` be reflected in real time.

## Production

### Build production package

To test the building process, you can build the app for production to the `./build` folder using `npm run build`.
If you wanted, you could take the contents of the `./build` directory push these to a web host; in the past, we would copy these to `bedhost/bedhost/static/bedhost-ui` to deploy with the server.
However, we are using an automated deployment with cloudflare (see below).

### Deployment

The actual deployment happens via a webhook to cloudflare. Pushes to the repository trigger cloudflare to re-build and re-deploy the static site using Cloudflare Pages.
