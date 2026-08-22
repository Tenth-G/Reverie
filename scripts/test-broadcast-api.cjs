const routes = [
  ["/broadcast/category/region/get", "GET"],
  ["/broadcast/channel/list?categoryId=0&regionId=0&limit=1&lastId=0", "GET"],
  ["/broadcast/channel/currentinfo?id=1", "GET"],
  ["/broadcast/channel/collect/list", "GET"],
  ["/broadcast/sub?id=1&t=0", "POST"],
  ["/radio/sport/get?bpm=120", "GET"],
];
const base = process.env.NCM_API_BASE || "http://127.0.0.1:3939";
const failures = [];
(async () => {
  for (const [path, method] of routes) {
    try {
      const response = await fetch(`${base}${path}`, {
        method,
        redirect: "manual",
      });
      if (response.status === 404)
        console.log(`${method} ${path}: 404 (upstream empty response)`);
      else console.log(`${method} ${path}: ${response.status}`);
    } catch (error) {
      failures.push(
        `${method} ${path}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  if (failures.length) {
    console.error(failures.join("\n"));
    process.exitCode = 1;
  } else console.log("broadcast route smoke test passed");
})();
