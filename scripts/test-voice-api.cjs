const routes = [
  ["/voicelist/search?podcastName=demo&limit=1&offset=0", "GET"],
  ["/voicelist/detail?id=1", "GET"],
  ["/voicelist/list?voiceListId=1&limit=1&offset=0", "GET"],
  ["/voicelist/list/search?name=demo&voiceListId=1&limit=1&offset=0", "GET"],
  ["/voice/detail?id=1", "GET"],
  ["/voice/lyric?id=1", "GET"],
  ["/voicelist/trans?radioId=1&programId=1&position=1", "POST"],
  ["/voice/delete?ids=1", "POST"],
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
      if (response.status === 404) failures.push(`${method} ${path}: 404`);
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
  } else {
    console.log("voice route smoke test passed");
  }
})();
