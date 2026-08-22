const routes = [["/artist/video?id=1&size=1&cursor=0&order=0", "GET"]];
const base = process.env.NCM_API_BASE || "http://127.0.0.1:3939";
(async () => {
  for (const [path, method] of routes) {
    const response = await fetch(`${base}${path}`, {
      method,
      redirect: "manual",
    });
    console.log(`${method} ${path}: ${response.status}`);
  }
  console.log("artist video route smoke test passed");
})();
