export enum MatchmakingType {
  Random = 'Random',
  RoundRobin = 'RoundRobin',
  Balanced = 'Balanced',
  Static = 'Static',
  Manual = 'Manual',
  HighLow = 'HighLow', // winners split and move up, losers split and move down
  // LowMidHigh, // eg 16 players - 1-4 never play 12-16, so match pool is [1-11], [5-16]
}

export enum SessionStatus {
  Created = "Created",
  Started = "Started",
  Completed = "Completed"
}