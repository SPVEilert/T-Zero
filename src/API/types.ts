export type LaunchItem = {
  id: string;
  missionPatch?: string;
  missionName: string;
  rocketName: string;
  launchpadName: string;
  launchDateUTC: string;
  success: boolean | null;
  upcoming: boolean;
  source: "spacex" | "spacedevs" | string;
};
