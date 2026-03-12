# Ainete Nimekirjad

Static tools for Estonian drug lists, ID code/age calculation, and a simple number extractor. This repository uses plain HTML/CSS/JS with ES modules.

## Development

- Scripts and styles have been modularised. Use a local web server to serve the files.
- `package.json` is used to mark the project as an ES module and provide a `test` script (requires Node.js).

### Running tests

Tests are plain Node.js tests; you don't need any extra dependencies.

```bash
node --test
```

The `tests/` directory contains unit tests for the calculator and ID utilities.

### Building data

A small build helper compresses the JSON payload used by `index.html`.

```bash
node scripts/build.js
```

This generates `data.json.gz` and minifies the original JSON. `js/index.js` will try to fetch the compressed file first, falling back to `data.json` if necessary.

## Security notes

Each HTML page includes a minimal Content Security Policy meta tag. External links in the footer use `rel="noopener noreferrer"`.
