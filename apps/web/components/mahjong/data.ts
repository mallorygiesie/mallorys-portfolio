export interface Game {
  date: string;
  outcome: "Win" | "Loss" | "Wall Game";
  winner: string;
  winningHand: string;
  handCategory: string;
}

export const games: Game[] = [
  // Apr 16
  { date: "2026-04-16T18:26:13", outcome: "Loss", winner: "Mahjorie", winningHand: "CR/3", handCategory: "CR" },
  { date: "2026-04-16T18:40:26", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-16T18:53:41", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-16T19:02:40", outcome: "Loss", winner: "Quintin", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-04-16T19:12:39", outcome: "Loss", winner: "Mahjorie", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-04-16T19:27:35", outcome: "Win", winner: "malloryg", winningHand: "CR/6", handCategory: "CR" },
  { date: "2026-04-16T20:17:35", outcome: "Loss", winner: "Quintin", winningHand: "2468/4", handCategory: "2468" },
  { date: "2026-04-16T20:32:38", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-16T20:45:22", outcome: "Loss", winner: "Dottie", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-16T20:55:18", outcome: "Win", winner: "malloryg", winningHand: "ALN/1", handCategory: "ALN" },
  { date: "2026-04-16T21:07:00", outcome: "Win", winner: "malloryg", winningHand: "2468/6", handCategory: "2468" },
  // Apr 17
  { date: "2026-04-17T10:40:21", outcome: "Loss", winner: "Quintin", winningHand: "369/1a", handCategory: "369" },
  { date: "2026-04-17T12:57:21", outcome: "Loss", winner: "Mahjorie", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-17T14:55:49", outcome: "Win", winner: "malloryg", winningHand: "13579/4", handCategory: "13579" },
  // Apr 18
  { date: "2026-04-18T14:22:13", outcome: "Win", winner: "malloryg", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-18T14:44:12", outcome: "Loss", winner: "Quintin", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-18T21:39:45", outcome: "Loss", winner: "Mahjorie", winningHand: "13579/5a", handCategory: "13579" },
  { date: "2026-04-18T21:50:56", outcome: "Win", winner: "malloryg", winningHand: "2468/3", handCategory: "2468" },
  { date: "2026-04-18T22:04:36", outcome: "Win", winner: "malloryg", winningHand: "CR/5a", handCategory: "CR" },
  { date: "2026-04-18T22:15:02", outcome: "Win", winner: "malloryg", winningHand: "2468/6", handCategory: "2468" },
  { date: "2026-04-18T22:37:49", outcome: "Loss", winner: "JoeC", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-04-18T22:48:17", outcome: "Loss", winner: "JoeC", winningHand: "CR/4b", handCategory: "CR" },
  // Apr 19
  { date: "2026-04-19T21:08:51", outcome: "Loss", winner: "WesT", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-04-19T21:16:18", outcome: "Win", winner: "malloryg", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-04-19T21:26:18", outcome: "Win", winner: "malloryg", winningHand: "369/6", handCategory: "369" },
  { date: "2026-04-19T21:34:25", outcome: "Win", winner: "malloryg", winningHand: "CR/3", handCategory: "CR" },
  { date: "2026-04-19T21:43:37", outcome: "Loss", winner: "AgattaD", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-04-19T21:57:22", outcome: "Loss", winner: "AgattaD", winningHand: "2026/1", handCategory: "2026" },
  { date: "2026-04-19T22:06:13", outcome: "Loss", winner: "WesT", winningHand: "WD/2", handCategory: "WD" },
  // Apr 20
  { date: "2026-04-20T18:32:23", outcome: "Win", winner: "malloryg", winningHand: "2026/4", handCategory: "2026" },
  { date: "2026-04-20T18:42:19", outcome: "Win", winner: "malloryg", winningHand: "CR/1b", handCategory: "CR" },
  { date: "2026-04-20T18:56:27", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-20T20:32:29", outcome: "Loss", winner: "WesT", winningHand: "2468/1b", handCategory: "2468" },
  { date: "2026-04-20T21:06:10", outcome: "Loss", winner: "WesT", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-04-20T21:14:07", outcome: "Loss", winner: "AgattaD", winningHand: "2468/4", handCategory: "2468" },
  { date: "2026-04-20T21:26:06", outcome: "Loss", winner: "JoeC", winningHand: "2026/1", handCategory: "2026" },
  { date: "2026-04-20T21:38:02", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-20T21:51:16", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-20T22:15:20", outcome: "Loss", winner: "AgattaD", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-04-20T22:26:32", outcome: "Loss", winner: "AgattaD", winningHand: "CR/3", handCategory: "CR" },
  // Apr 21
  { date: "2026-04-21T17:55:13", outcome: "Loss", winner: "AgattaD", winningHand: "2468/4", handCategory: "2468" },
  { date: "2026-04-21T18:07:59", outcome: "Win", winner: "malloryg", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-04-21T21:53:38", outcome: "Win", winner: "malloryg", winningHand: "WD/6", handCategory: "WD" },
  { date: "2026-04-21T22:33:27", outcome: "Loss", winner: "AgattaD", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-04-21T22:48:55", outcome: "Win", winner: "malloryg", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-04-21T23:08:13", outcome: "Loss", winner: "WesT", winningHand: "WD/3", handCategory: "WD" },
  // Apr 22
  { date: "2026-04-22T18:47:08", outcome: "Loss", winner: "AnnieD", winningHand: "2468/5", handCategory: "2468" },
  { date: "2026-04-22T18:55:17", outcome: "Loss", winner: "AmistadI", winningHand: "WD/6", handCategory: "WD" },
  { date: "2026-04-22T19:23:27", outcome: "Win", winner: "malloryg", winningHand: "2468/6", handCategory: "2468" },
  { date: "2026-04-22T19:30:12", outcome: "Loss", winner: "AnnieD", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-04-22T19:36:47", outcome: "Loss", winner: "CurtZ", winningHand: "2468/6", handCategory: "2468" },
  { date: "2026-04-22T19:42:07", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-04-22T20:01:34", outcome: "Loss", winner: "AmistadI", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-04-22T20:16:51", outcome: "Win", winner: "malloryg", winningHand: "WD/1b", handCategory: "WD" },
  // Apr 23
  { date: "2026-04-23T19:04:32", outcome: "Win", winner: "malloryg", winningHand: "CR/5a", handCategory: "CR" },
  { date: "2026-04-23T19:11:04", outcome: "Loss", winner: "AnnieD", winningHand: "CR/1a", handCategory: "CR" },
  { date: "2026-04-23T19:21:00", outcome: "Loss", winner: "AnnieD", winningHand: "369/5", handCategory: "369" },
  { date: "2026-04-23T19:46:08", outcome: "Win", winner: "malloryg", winningHand: "ALN/3", handCategory: "ALN" },
  // Apr 24
  { date: "2026-04-24T23:21:05", outcome: "Loss", winner: "AmistadI", winningHand: "WD/1a", handCategory: "WD" },
  { date: "2026-04-24T23:29:58", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  // Apr 25
  { date: "2026-04-25T13:47:46", outcome: "Loss", winner: "AnnieD", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-04-25T13:56:34", outcome: "Loss", winner: "CurtZ", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-04-25T14:06:04", outcome: "Win", winner: "malloryg", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-04-25T15:56:05", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-25T18:45:53", outcome: "Win", winner: "malloryg", winningHand: "369/2", handCategory: "369" },
  { date: "2026-04-25T22:25:22", outcome: "Loss", winner: "CurtZ", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-04-25T22:33:39", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-04-25T22:42:43", outcome: "Loss", winner: "AnnieD", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-04-25T22:54:36", outcome: "Loss", winner: "CurtZ", winningHand: "CR/5b", handCategory: "CR" },
  { date: "2026-04-25T23:07:13", outcome: "Loss", winner: "CurtZ", winningHand: "13579/6a", handCategory: "13579" },
  { date: "2026-04-25T23:16:58", outcome: "Loss", winner: "AmistadI", winningHand: "369/4", handCategory: "369" },
  { date: "2026-04-25T23:29:46", outcome: "Loss", winner: "AnnieD", winningHand: "CR/1b", handCategory: "CR" },
  { date: "2026-04-25T23:42:13", outcome: "Loss", winner: "AnnieD", winningHand: "2468/1b", handCategory: "2468" },
  { date: "2026-04-25T23:48:04", outcome: "Loss", winner: "CurtZ", winningHand: "2468/1b", handCategory: "2468" },
  // Apr 26
  { date: "2026-04-26T00:06:04", outcome: "Loss", winner: "AnnieD", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-26T00:11:39", outcome: "Win", winner: "malloryg", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-04-26T00:18:52", outcome: "Win", winner: "malloryg", winningHand: "WD/1a", handCategory: "WD" },
  { date: "2026-04-26T00:31:39", outcome: "Loss", winner: "AmistadI", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-04-26T00:38:07", outcome: "Win", winner: "malloryg", winningHand: "13579/6a", handCategory: "13579" },
  // Apr 27
  { date: "2026-04-27T22:20:33", outcome: "Loss", winner: "CurtZ", winningHand: "13579/4", handCategory: "13579" },
  { date: "2026-04-27T22:29:20", outcome: "Loss", winner: "AnnieD", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-04-27T22:42:03", outcome: "Loss", winner: "AmistadI", winningHand: "CR/5b", handCategory: "CR" },
  { date: "2026-04-27T22:49:50", outcome: "Win", winner: "malloryg", winningHand: "369/6", handCategory: "369" },
  { date: "2026-04-27T23:02:23", outcome: "Loss", winner: "AnnieD", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-04-27T23:09:56", outcome: "Loss", winner: "CurtZ", winningHand: "WD/2", handCategory: "WD" },
  // May 10
  { date: "2026-05-10T21:19:35", outcome: "Loss", winner: "CurtZ", winningHand: "CR/7b", handCategory: "CR" },
  { date: "2026-05-10T21:30:51", outcome: "Loss", winner: "CurtZ", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-05-10T21:37:02", outcome: "Win", winner: "malloryg", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-05-10T21:45:19", outcome: "Loss", winner: "CurtZ", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-05-10T21:56:36", outcome: "Loss", winner: "CurtZ", winningHand: "WD/3", handCategory: "WD" },
  // May 12
  { date: "2026-05-12T21:04:35", outcome: "Loss", winner: "AnnieD", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-05-12T21:16:22", outcome: "Loss", winner: "AnnieD", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-05-12T21:25:10", outcome: "Loss", winner: "AmistadI", winningHand: "13579/4", handCategory: "13579" },
  { date: "2026-05-12T21:35:18", outcome: "Loss", winner: "CurtZ", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-05-12T21:47:02", outcome: "Win", winner: "malloryg", winningHand: "CR/8", handCategory: "CR" },
  { date: "2026-05-12T21:58:24", outcome: "Loss", winner: "AnnieD", winningHand: "369/4", handCategory: "369" },
  { date: "2026-05-12T22:09:02", outcome: "Loss", winner: "CurtZ", winningHand: "ALN/2", handCategory: "ALN" },
  // May 14
  { date: "2026-05-14T22:45:27", outcome: "Win", winner: "malloryg", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-05-14T23:00:56", outcome: "Loss", winner: "CurtZ", winningHand: "13579/1b", handCategory: "13579" },
  { date: "2026-05-14T23:24:30", outcome: "Win", winner: "malloryg", winningHand: "13579/2a", handCategory: "13579" },
  // May 15
  { date: "2026-05-15T19:59:25", outcome: "Loss", winner: "CurtZ", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-05-15T20:08:10", outcome: "Loss", winner: "CurtZ", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-05-15T20:20:58", outcome: "Win", winner: "malloryg", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-05-15T20:28:50", outcome: "Loss", winner: "CurtZ", winningHand: "CR/5b", handCategory: "CR" },
  // May 18
  { date: "2026-05-18T22:07:43", outcome: "Loss", winner: "AmistadI", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-05-18T22:22:42", outcome: "Loss", winner: "AmistadI", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-05-18T22:37:22", outcome: "Loss", winner: "AnnieD", winningHand: "WD/5", handCategory: "WD" },
  // May 21
  { date: "2026-05-21T21:20:22", outcome: "Loss", winner: "AnnieD", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-05-21T21:28:22", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-05-21T21:34:54", outcome: "Loss", winner: "AmistadI", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-05-21T21:49:32", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-05-21T21:59:33", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  // May 23
  { date: "2026-05-23T13:31:43", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  // May 24
  { date: "2026-05-24T17:22:47", outcome: "Loss", winner: "CurtZ", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-05-24T22:39:05", outcome: "Loss", winner: "AmistadI", winningHand: "CR/5b", handCategory: "CR" },
  { date: "2026-05-24T22:47:05", outcome: "Win", winner: "malloryg", winningHand: "WD/6", handCategory: "WD" },
  { date: "2026-05-24T22:58:11", outcome: "Loss", winner: "AnnieD", winningHand: "369/1a", handCategory: "369" },
  { date: "2026-05-24T23:07:32", outcome: "Loss", winner: "AnnieD", winningHand: "13579/1a", handCategory: "13579" },
  { date: "2026-05-24T23:20:03", outcome: "Loss", winner: "AmistadI", winningHand: "369/4", handCategory: "369" },
  { date: "2026-05-24T23:29:04", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-05-24T23:46:54", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-05-24T23:57:55", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  // May 25
  { date: "2026-05-25T00:14:27", outcome: "Win", winner: "malloryg", winningHand: "2468/3", handCategory: "2468" },
  { date: "2026-05-25T20:25:43", outcome: "Loss", winner: "AmistadI", winningHand: "Q/2", handCategory: "Q" },
  { date: "2026-05-25T20:39:57", outcome: "Loss", winner: "AnnieD", winningHand: "ALN/3", handCategory: "ALN" },
  { date: "2026-05-25T20:49:08", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2b", handCategory: "CR" },
  // Jun 3
  { date: "2026-06-03T18:14:17", outcome: "Win", winner: "malloryg", winningHand: "2468/8", handCategory: "2468" },
  { date: "2026-06-03T18:29:05", outcome: "Loss", winner: "AmistadI", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-06-03T18:39:46", outcome: "Loss", winner: "CurtZ", winningHand: "2026/4", handCategory: "2026" },
  { date: "2026-06-03T18:50:44", outcome: "Loss", winner: "CurtZ", winningHand: "2468/1b", handCategory: "2468" },
  { date: "2026-06-03T19:17:33", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4a", handCategory: "CR" },
  { date: "2026-06-03T19:30:24", outcome: "Loss", winner: "AmistadI", winningHand: "13579/6b", handCategory: "13579" },
  { date: "2026-06-03T20:14:04", outcome: "Win", winner: "malloryg", winningHand: "13579/2b", handCategory: "13579" },
  { date: "2026-06-03T20:22:55", outcome: "Win", winner: "malloryg", winningHand: "CR/7a", handCategory: "CR" },
  { date: "2026-06-03T20:38:14", outcome: "Loss", winner: "CurtZ", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-06-03T20:52:11", outcome: "Loss", winner: "AnnieD", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-06-03T21:03:34", outcome: "Win", winner: "malloryg", winningHand: "13579/5a", handCategory: "13579" },
  { date: "2026-06-03T21:13:21", outcome: "Loss", winner: "AmistadI", winningHand: "CR/5a", handCategory: "CR" },
  { date: "2026-06-03T21:18:53", outcome: "Win", winner: "malloryg", winningHand: "CR/1b", handCategory: "CR" },
  { date: "2026-06-03T21:23:30", outcome: "Win", winner: "malloryg", winningHand: "ALN/2", handCategory: "ALN" },
  { date: "2026-06-03T21:32:46", outcome: "Loss", winner: "AnnieD", winningHand: "2468/1a", handCategory: "2468" },
  { date: "2026-06-03T21:44:04", outcome: "Loss", winner: "AmistadI", winningHand: "WD/6", handCategory: "WD" },
  { date: "2026-06-03T21:50:49", outcome: "Loss", winner: "AnnieD", winningHand: "CR/3", handCategory: "CR" },
  { date: "2026-06-03T22:00:58", outcome: "Win", winner: "malloryg", winningHand: "2026/3", handCategory: "2026" },
  { date: "2026-06-03T22:36:25", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4b", handCategory: "CR" },
  // Jun 4
  { date: "2026-06-04T18:33:36", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-06-04T18:40:52", outcome: "Win", winner: "malloryg", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-06-04T18:52:38", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-06-04T22:43:42", outcome: "Win", winner: "malloryg", winningHand: "CR/5b", handCategory: "CR" },
  { date: "2026-06-04T22:52:00", outcome: "Win", winner: "malloryg", winningHand: "2468/1a", handCategory: "2468" },
  { date: "2026-06-04T23:01:27", outcome: "Win", winner: "malloryg", winningHand: "13579/5b", handCategory: "13579" },
  // Jun 5
  { date: "2026-06-05T14:47:51", outcome: "Loss", winner: "AmistadI", winningHand: "CR/5a", handCategory: "CR" },
  { date: "2026-06-05T14:55:54", outcome: "Loss", winner: "AmistadI", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-06-05T15:23:29", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-06-05T15:33:20", outcome: "Loss", winner: "AnnieD", winningHand: "13579/2b", handCategory: "13579" },
  { date: "2026-06-05T15:43:11", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-06-05T15:51:32", outcome: "Loss", winner: "CurtZ", winningHand: "WD/5", handCategory: "WD" },
  { date: "2026-06-05T16:02:14", outcome: "Loss", winner: "AmistadI", winningHand: "2026/1", handCategory: "2026" },
  { date: "2026-06-05T16:09:42", outcome: "Loss", winner: "AmistadI", winningHand: "WD/1a", handCategory: "WD" },
  { date: "2026-06-05T16:27:28", outcome: "Win", winner: "malloryg", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-06-05T17:15:12", outcome: "Win", winner: "malloryg", winningHand: "2468/1a", handCategory: "2468" },
  { date: "2026-06-05T17:22:31", outcome: "Win", winner: "malloryg", winningHand: "CR/1b", handCategory: "CR" },
  { date: "2026-06-05T18:05:38", outcome: "Win", winner: "malloryg", winningHand: "WD/1a", handCategory: "WD" },
  { date: "2026-06-05T18:26:06", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-06-05T21:23:45", outcome: "Loss", winner: "AnnieD", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-06-05T21:31:30", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-06-05T21:39:33", outcome: "Loss", winner: "CurtZ", winningHand: "13579/6a", handCategory: "13579" },
  { date: "2026-06-05T21:47:39", outcome: "Loss", winner: "AmistadI", winningHand: "13579/4", handCategory: "13579" },
  // Jun 6
  { date: "2026-06-06T11:21:40", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  // Jun 7
  { date: "2026-06-07T16:07:17", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-06-07T16:16:21", outcome: "Loss", winner: "AmistadI", winningHand: "WD/2", handCategory: "WD" },
  // Jun 8
  { date: "2026-06-08T21:49:24", outcome: "Loss", winner: "AmistadI", winningHand: "13579/1b", handCategory: "13579" },
  { date: "2026-06-08T21:59:46", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-06-08T22:08:43", outcome: "Loss", winner: "AmistadI", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-06-08T22:18:35", outcome: "Loss", winner: "CurtZ", winningHand: "CR/3", handCategory: "CR" },
  { date: "2026-06-08T22:25:58", outcome: "Loss", winner: "AnnieD", winningHand: "13579/2a", handCategory: "13579" },
  { date: "2026-06-08T22:31:50", outcome: "Loss", winner: "AnnieD", winningHand: "2468/5", handCategory: "2468" },
  { date: "2026-06-08T22:40:38", outcome: "Loss", winner: "AnnieD", winningHand: "CR/7b", handCategory: "CR" },
  { date: "2026-06-08T22:48:16", outcome: "Loss", winner: "AnnieD", winningHand: "2026/3", handCategory: "2026" },
  { date: "2026-06-08T22:55:40", outcome: "Loss", winner: "AmistadI", winningHand: "2468/4", handCategory: "2468" },
  // Jun 9
  { date: "2026-06-09T18:52:43", outcome: "Win", winner: "malloryg", winningHand: "WD/1a", handCategory: "WD" },
  { date: "2026-06-09T19:05:15", outcome: "Loss", winner: "AnnieD", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-06-09T19:25:07", outcome: "Loss", winner: "AnnieD", winningHand: "WD/3", handCategory: "WD" },
  { date: "2026-06-09T19:59:20", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2b", handCategory: "CR" },
  // Jun 10
  { date: "2026-06-10T22:00:52", outcome: "Loss", winner: "CurtZ", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-06-10T22:20:39", outcome: "Loss", winner: "AnnieD", winningHand: "WD/3", handCategory: "WD" },
  // Jun 13
  { date: "2026-06-13T15:25:02", outcome: "Loss", winner: "AnnieD", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-06-13T15:34:14", outcome: "Loss", winner: "AmistadI", winningHand: "CR/5b", handCategory: "CR" },
  { date: "2026-06-13T15:56:12", outcome: "Loss", winner: "CurtZ", winningHand: "CR/4b", handCategory: "CR" },
  { date: "2026-06-13T16:02:19", outcome: "Loss", winner: "AnnieD", winningHand: "WD/2", handCategory: "WD" },
  { date: "2026-06-13T16:08:16", outcome: "Loss", winner: "AmistadI", winningHand: "CR/2a", handCategory: "CR" },
  { date: "2026-06-13T16:16:56", outcome: "Wall Game", winner: "", winningHand: "", handCategory: "" },
  { date: "2026-06-13T16:25:36", outcome: "Win", winner: "malloryg", winningHand: "13579/1a", handCategory: "13579" },
  { date: "2026-06-13T16:33:33", outcome: "Loss", winner: "CurtZ", winningHand: "WD/4", handCategory: "WD" },
  { date: "2026-06-13T21:30:56", outcome: "Win", winner: "malloryg", winningHand: "13579/1b", handCategory: "13579" },
  { date: "2026-06-13T21:44:33", outcome: "Loss", winner: "CurtZ", winningHand: "CR/2b", handCategory: "CR" },
  { date: "2026-06-13T21:51:06", outcome: "Loss", winner: "CurtZ", winningHand: "13579/6b", handCategory: "13579" },
];

export interface HandTendency {
  category: string;
  label: string;
  count: number;
  posteriorMean: number;
  ciLow: number;
  ciHigh: number;
}

export interface OpponentProfile {
  name: string;
  totalWins: number;
  handTendencies: HandTendency[];
  primaryThreat: string;
  recentTrend: "worsening" | "stable" | "improving";
}

const ALL_CATEGORIES = ["CR", "WD", "2468", "13579", "369", "ALN", "2026", "Q"];

const CATEGORY_LABELS: Record<string, string> = {
  CR: "Consec. Run",
  WD: "Wind & Dragon",
  ALN: "Any Like #s",
  "369": "3-6-9",
  "2468": "2-4-6-8",
  "13579": "1-3-5-7-9",
  "2026": "2026",
  Q: "Quints",
};

export function categoryLabel(cat: string): string {
  return CATEGORY_LABELS[cat] ?? cat;
}

export function computeStats(data: Game[]) {
  const wins = data.filter((g) => g.outcome === "Win");
  const losses = data.filter((g) => g.outcome === "Loss");
  const walls = data.filter((g) => g.outcome === "Wall Game");
  const decided = wins.length + losses.length;

  const countByCategory = (gs: Game[]) => {
    const counts: Record<string, number> = {};
    for (const g of gs) {
      if (g.handCategory) counts[g.handCategory] = (counts[g.handCategory] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([category, count]) => ({ category, label: categoryLabel(category), count }))
      .sort((a, b) => b.count - a.count);
  };

  const opponentCounts: Record<string, number> = {};
  for (const g of losses) {
    opponentCounts[g.winner] = (opponentCounts[g.winner] ?? 0) + 1;
  }
  const opponents = Object.entries(opponentCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  let cumWins = 0;
  let cumDecided = 0;
  const winRateOverTime = sorted
    .filter((g) => g.outcome !== "Wall Game")
    .map((g, i) => {
      if (g.outcome === "Win") cumWins++;
      cumDecided++;
      return { game: i + 1, rate: Math.round((cumWins / cumDecided) * 100) };
    });

  return {
    total: data.length,
    wins: wins.length,
    losses: losses.length,
    walls: walls.length,
    winRate: decided > 0 ? Math.round((wins.length / decided) * 100) : 0,
    yourHands: countByCategory(wins),
    opponentHands: countByCategory(losses),
    opponents,
    winRateOverTime,
  };
}

export function computeOpponentModels(data: Game[]): OpponentProfile[] {
  const losses = data.filter((g) => g.outcome === "Loss");
  const allSorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const K = ALL_CATEGORIES.length;
  const ALPHA = 1; // flat Dirichlet prior

  const byOpponent: Record<string, Game[]> = {};
  for (const g of losses) {
    if (g.winner) {
      if (!byOpponent[g.winner]) byOpponent[g.winner] = [];
      byOpponent[g.winner].push(g);
    }
  }

  return Object.entries(byOpponent)
    .filter(([, oppGames]) => oppGames.length >= 3)
    .map(([name, oppGames]) => {
      const N = oppGames.length;

      const handTendencies: HandTendency[] = ALL_CATEGORIES.map((cat) => {
        const count = oppGames.filter((g) => g.handCategory === cat).length;
        const alphaPosterior = count + ALPHA;
        const betaPosterior = N - count + (K - 1) * ALPHA;
        const total = N + K * ALPHA;
        const posteriorMean = alphaPosterior / total;
        const variance = (alphaPosterior * betaPosterior) / (total * total * (total + 1));
        const sd = Math.sqrt(variance);
        return {
          category: cat,
          label: categoryLabel(cat),
          count,
          posteriorMean,
          ciLow: Math.max(0, posteriorMean - 1.645 * sd),
          ciHigh: Math.min(1, posteriorMean + 1.645 * sd),
        };
      }).sort((a, b) => b.posteriorMean - a.posteriorMean);

      const primaryThreat = handTendencies[0].category;

      // Trend: compare how often this opponent beats Mallory in the first vs second half of all games
      const oppWinDates = new Set(oppGames.map((g) => g.date));
      const mid = Math.floor(allSorted.length / 2);
      const firstHalf = allSorted.slice(0, mid);
      const secondHalf = allSorted.slice(mid);
      const rate1 = firstHalf.length > 0 ? firstHalf.filter((g) => oppWinDates.has(g.date)).length / firstHalf.length : 0;
      const rate2 = secondHalf.length > 0 ? secondHalf.filter((g) => oppWinDates.has(g.date)).length / secondHalf.length : 0;
      const diff = rate2 - rate1;
      const recentTrend: OpponentProfile["recentTrend"] =
        diff > 0.03 ? "worsening" : diff < -0.03 ? "improving" : "stable";

      return { name, totalWins: N, handTendencies, primaryThreat, recentTrend };
    })
    .sort((a, b) => b.totalWins - a.totalWins);
}
