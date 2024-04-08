# bedhost-ui

This repository contains the source files for bedhost user interface written in React and built with Vite.

## Development

1. Configure the environment variables by creating a `.env` file in the root directory of the project. The `.env` file should contain the following variables:

```
VITE_API_BASE=...
```

2. Generate types for the API response models by running the following command:

```
npm run generate-types
```

3. Install node module dependencies defined in `package.json`

```
npm install
```

4. Make sure `bedhost` FastAPI server is running at the specified location in the `.env` file.
5. Start development server on port 5173 by running the start react script (defined in `package.json`).

```
npm run dev
```

5. Open [http://localhost:5173](http://localhost:5173/) to view it in the browser.

You can then develop the app by editing the source in the `/src` subfolder. Changes made in `./src` be reflected in real time.

## Production

### Build production package

To test the building process, you can build the app for production to the `./build` folder using `npm run build`.
If you wanted, you could take the contents of the `./build` directory push these to a web host; in the past, we would copy these to `bedhost/bedhost/static/bedhost-ui` to deploy with the server.
However, we are using an automated deployment with cloudflare (see below).

### Deployment

The actual deployment happens via a webhook to cloudflare. Pushes to the repository trigger cloudflare to re-build and re-deploy the static site using Cloudflare Pages.
