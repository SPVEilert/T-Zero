import spacexAPI from "./spacexAPI";
import spacedevsAPI from "./spacedevsAPI";
import { LaunchItem } from "./types";

function dedupeLaunches(launches: LaunchItem[]): LaunchItem[] {
  const seen = new Set<string>();
  const deduped: LaunchItem[] = [];

  for (const launch of launches) {
    const key = launch.id || `${launch.missionName}-${launch.launchDateUTC}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(launch);
    }
  }

  return deduped;
}

class LaunchesService {
  async fetchCombinedLaunches(upcoming: boolean): Promise<LaunchItem[]> {
    const allLaunches: LaunchItem[] = [];

    // Try SpaceDevs API
    try {
      const spaceDevsLaunches = await spacedevsAPI.fetchLaunches(upcoming);
      allLaunches.push(...spaceDevsLaunches);
    } catch (error: any) {
      console.warn("SpaceDevs API failed:", error.message);
    }

    // Try SpaceX API
    try {
      const spaceXLaunches = await spacexAPI.fetchLaunches(upcoming);
      allLaunches.push(...spaceXLaunches);
    } catch (error: any) {
      console.warn("SpaceX API failed:", error.message);
    }

    // Deduplicate
    const combined = dedupeLaunches(allLaunches);

    // Sort by launch date
    combined.sort((a, b) => {
      const dateA = new Date(a.launchDateUTC).getTime();
      const dateB = new Date(b.launchDateUTC).getTime();
      return upcoming ? dateA - dateB : dateB - dateA;
    });

    return combined;
  }

  resetAll() {
    spacexAPI.reset();
    spacedevsAPI.reset();
  }
}

export default new LaunchesService();
