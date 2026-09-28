// MediaRecorder writes a fragmented MP4 whose header says 0 s (the first fragment only for each track), so players
// show the wrong length. This writes the real duration into mvhd, tkhd and mdhd, in place: no byte moves, no re-encode.
const boxes = (b, off, end) => {
  const out = [];
  while (off < end) {
    let size = b.readUInt32BE(off), hdr = 8; const type = b.subarray(off + 4, off + 8).toString("latin1");
    if (size === 1) { size = Number(b.readBigUInt64BE(off + 8)); hdr = 16; }
    if (size === 0) size = end - off;
    out.push({ type, body: off + hdr, end: off + size }); off += size;
  }
  return out;
};
const read = (b, off, big) => (big ? Number(b.readBigUInt64BE(off)) : b.readUInt32BE(off));
const write = (b, off, v, big) => (big ? b.writeBigUInt64BE(BigInt(Math.round(v)), off) : b.writeUInt32BE(Math.round(v), off));

/** Fix the durations of a fragmented MP4 in place; returns the length in seconds. */
export function fixMp4Duration(b) {
  const top = boxes(b, 0, b.length), moov = top.find(x => x.type === "moov"), trex = {}, tracks = {};
  for (const x of boxes(b, moov.body, moov.end)) {
    if (x.type === "mvex") for (const t of boxes(b, x.body, x.end)) if (t.type === "trex") trex[b.readUInt32BE(t.body + 4)] = b.readUInt32BE(t.body + 12);
    if (x.type === "trak") {
      const k = boxes(b, x.body, x.end), tkhd = k.find(y => y.type === "tkhd"), mdia = k.find(y => y.type === "mdia");
      const mdhd = boxes(b, mdia.body, mdia.end).find(y => y.type === "mdhd"), id = b.readUInt32BE(tkhd.body + (b[tkhd.body] ? 20 : 12));
      tracks[id] = { tkhd, mdhd, scale: b.readUInt32BE(mdhd.body + (b[mdhd.body] ? 20 : 12)), end: 0 };
    }
  }
  for (const moof of top.filter(x => x.type === "moof")) for (const traf of boxes(b, moof.body, moof.end).filter(x => x.type === "traf")) {
    const k = boxes(b, traf.body, traf.end), tfhd = k.find(x => x.type === "tfhd"), flags = b.readUInt32BE(tfhd.body) & 0xffffff, id = b.readUInt32BE(tfhd.body + 4);
    let p = tfhd.body + 8, dflt = trex[id]; if (flags & 1) p += 8; if (flags & 2) p += 4; if (flags & 8) dflt = b.readUInt32BE(p);
    const tfdt = k.find(x => x.type === "tfdt"); let t = read(b, tfdt.body + 4, !!b[tfdt.body]);
    for (const trun of k.filter(x => x.type === "trun")) {
      const f = b.readUInt32BE(trun.body) & 0xffffff, n = b.readUInt32BE(trun.body + 4); let q = trun.body + 8; if (f & 1) q += 4; if (f & 4) q += 4;
      for (let i = 0; i < n; i++) { let d = dflt; if (f & 0x100) { d = b.readUInt32BE(q); q += 4; } if (f & 0x200) q += 4; if (f & 0x400) q += 4; if (f & 0x800) q += 4; t += d; }
    }
    tracks[id].end = Math.max(tracks[id].end, t);
  }
  const secs = Math.max(...Object.values(tracks).map(t => t.end / t.scale));
  const mvhd = boxes(b, moov.body, moov.end).find(x => x.type === "mvhd"), v1 = !!b[mvhd.body], movie = b.readUInt32BE(mvhd.body + (v1 ? 20 : 12));
  write(b, mvhd.body + (v1 ? 24 : 16), secs * movie, v1);
  for (const t of Object.values(tracks)) {
    const tv = !!b[t.tkhd.body], mv = !!b[t.mdhd.body];
    write(b, t.tkhd.body + (tv ? 28 : 20), t.end / t.scale * movie, tv); write(b, t.mdhd.body + (mv ? 24 : 16), t.end, mv);
  }
  return secs;
}
