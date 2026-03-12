// simple build helper that compresses data.json for deployment
// run with `node scripts/build.js` (requires Node.js)

import { promises as fs } from "fs";
import zlib from "zlib";

async function build() {
  const raw = await fs.readFile("data.json", "utf8");
  // pretty- or minified depending on preference; here we minify by
  // parsing and re-stringifying which removes whitespace.
  const min = JSON.stringify(JSON.parse(raw));
  await fs.writeFile("data.json.gz", zlib.gzipSync(min));
  console.log(
    "Created data.json.gz (",
    (await fs.stat("data.json.gz")).size,
    "bytes )",
  );
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
