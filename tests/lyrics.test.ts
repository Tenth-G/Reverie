import assert from "node:assert/strict";
import test from "node:test";
import {
  formatTime,
  isLyricLine,
  parseLyrics,
  pickRandomLyricLine,
} from "../src/utils/lyrics.ts";

test("parseLyrics merges translations and removes duplicate timestamps", () => {
  const lines = parseLyrics(
    "[00:01.00]第一行\n[00:01.00]重复行\n[00:02.50]第二行",
    "[00:01.00]First line\n[00:02.50]第二行",
  );

  assert.deepEqual(lines, [
    { time: 1000, text: "第一行", translation: "First line" },
    { time: 2500, text: "第二行" },
  ]);
});

test("parseLyrics handles multiple timestamps and empty lyrics", () => {
  assert.deepEqual(parseLyrics("[00:01][00:03]回声"), [
    { time: 1000, text: "回声" },
    { time: 3000, text: "回声" },
  ]);
  assert.deepEqual(parseLyrics(""), [{ time: 0, text: "纯音乐，请欣赏" }]);
});

test("formatTime clamps invalid values and supports hours", () => {
  assert.equal(formatTime(-1), "0:00");
  assert.equal(formatTime(Number.NaN), "0:00");
  assert.equal(formatTime(3_661_000), "1:01:01");
});

test("lyric quote helpers reject credits and retain meaningful lines", () => {
  assert.equal(isLyricLine("作词：某某"), false);
  assert.equal(isLyricLine("女：这一段是对白"), false);
  assert.equal(isLyricLine("风吹过安静的街道"), true);
  assert.equal(
    pickRandomLyricLine("[00:01]作曲：某某\n[00:02]风吹过安静的街道"),
    "风吹过安静的街道",
  );
});
