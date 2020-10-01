# bedhost-ui

This directory contains the source files for bedhost user interface built with React.

## Development

_Make sure bedhost FastAPI server is running at port 8000_

Install node modules defined in `package.json`

```
npm install
```

Start Node server in the development mode on port 3000 by running the start react-script (defined in `package.json`).

```
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in the browser. Changes made in `./src` will cause server updates

## Prepare production package

Build the app for production to the `./build` folder

```
npm run build
```

The contents of the `./build` directory can be copier over to `bedhost/bedhost/static/bedhost-ui`
