const { performance } = require('perf_hooks');
const start = performance.now();
fetch('http://localhost:3000/api/articles', {
  headers: {
    // we need a valid cookie to test, let's just test a public endpoint or simulate
  }
}).then(() => {
  console.log(`Fetch took ${performance.now() - start}ms`);
}).catch(console.error);
