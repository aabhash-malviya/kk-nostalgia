// Track & playlist data for the player.
//
// IMPORTANT — read before editing:
// videoId must point to a video YOU have the right to embed — either your own
// upload, or the rights holder's own official YouTube upload with embedding
// left on. This file ships with videoId left blank on purpose: song titles
// and artist credits are plain metadata, but a videoId is what actually
// streams the recording, so that choice is left to you rather than made on
// your behalf here.
//
// Adding a song is a one-line change: copy a Track object, fill in the
// videoId, and add it to a playlist's `tracks` array.

export type Track = {
  id: string;
  title: string;
  artist: string;
  film: string;
  year: number | null;
  duration: string; // mm:ss, shown before real playback data is available
  videoId: string; // fill in — see note above
};

export type Playlist = {
  id: string;
  name: string;
  tracks: Track[];
};

function track(
  id: string,
  title: string,
  film: string,
  year: number | null,
  videoId: string = "",
): Track {
  return {
    id,
    title,
    artist: "KK",
    film,
    year,
    duration: "--:--",
    videoId,
  };
}

export const playlists: Playlist[] = [
  {
    id: "the-hits",
    name: "The Hits",
    tracks: [
      track("hit-01", "Yaaron", "", null, "LCfvYo3ILG0"),
      track("hit-02", "Pal", "", null, "NUqlCJTYu6I"),
      track("hit-03", "Haule Haule", "", null, "KLO2kmYz9K8"),
      track("hit-04", "Jab Bhi Koi Haseena", "", null, "kzdqSXwJXks"),
      track("hit-05", "Dil Yeh Tera", "", null, "0l9RGAeML5E"),
      track("hit-06", "Zara Sa", "", null, "-8C_2BBVWk8"),
      track("hit-07", "Tu Hi Meri Shab Hai", "", null, "mWBvudKcByg"),
      track("hit-08", "Awarapan Banjarapan", "", null, "zHgnRLWe_GE"),
    ],
  },
  {
    id: "dil-ibaadat",
    name: "Dil & Ibaadat",
    tracks: [
      track("dil-01", "Kya Mujhe Pyaar Hai", "", null, "Gg6NMU4ivXM"),
      track("dil-02", "Tu Salaamat", "", null, "TeDD5hGWsrs"),
      track("dil-03", "Dekha Tujhe Sau Martaba", "", null, "_u5Dg99VLOo"),
      track("dil-04", "Jalte Hain", "", null, "1eLF6x0dy38"),
      track("dil-05", "Aankhon Mein Teri", "", null, "7KKVb0_IdD4"),
      track("dil-06", "Dil Ibaadat", "", null, "U2QNhsAgIIE"),
      track("dil-07", "Zindagi Do Pal Ki", "", null, "r-XG86T2jNc"),
      track("dil-08", "Alvida", "", null, "hM9QDpLHhdw"),
    ],
  },
  {
    id: "deep-cuts",
    name: "Deep Cuts",
    tracks: [
      track("deep-01", "Jannatein Kahan", "", null, "rN5i0SaPsLA"),
      track("deep-02", "Tujhe Sochta Hoon", "", null, "PkhfKq9m0Uo"),
      track("deep-03", "Meri Maa", "", null, "Ov3L0MRyo2Q"),
      track("deep-04", "Dil Aaj Kal", "", null, "XsYD-s7k_-M"),
      track("deep-05", "Kal Ki Hi Baat Hai", "", null, "JeGBNhyJeE4"),
      track("deep-06", "Chhal", "", null, "0qgoQ_rGamw"),
      track("deep-07", "Rulati Hain Mohabbatein", "", null, "PQWcW3-H77Y"),
    ],
  },
];
