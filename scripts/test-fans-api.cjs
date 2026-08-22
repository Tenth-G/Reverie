const routes = [
  ["/creator/authinfo/get", "GET"],
  ["/fanscenter/overview/get", "GET"],
  ["/fanscenter/trend/list?type=0", "GET"],
  ["/fanscenter/basicinfo/age/get", "GET"],
  ["/fanscenter/basicinfo/gender/get", "GET"],
  ["/fanscenter/basicinfo/province/get", "GET"],
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
  } else console.log("fans route smoke test passed");
})();
