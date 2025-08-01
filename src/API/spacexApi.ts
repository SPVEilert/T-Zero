import { LaunchItem } from "./types";

export type SpaceXLaunch = {
  id: string;
  name: string;
  date_utc: string;
  upcoming: boolean;
  success: boolean | null;
  links: {
    patch: {
      small?: string | null;
      large?: string | null;
    };
  };
  rocket: string;
  launchpad: string;
};

const PAGE_SIZE = 20;

class SpacexAPI {
  private offset = 0;
  private noMore = false;

  private BASE_URL = "https://api.spacexdata.com/v5";

  normalizeLaunch(launch: SpaceXLaunch): LaunchItem {
    return {
      id: `spacex_${launch.id}`,
      missionPatch: launch.links.patch.small || undefined,
      missionName: launch.name,
      rocketName: launch.rocket || "Unknown Rocket",
      launchpadName: launch.launchpad || "Unknown Launchpad",
      launchDateUTC: launch.date_utc,
      success: launch.success,
      upcoming: launch.upcoming,
      source: "spacex" as const,
    };
  }

  async fetchLaunches(upcoming: boolean) {
    if (this.noMore) return [];

    const now = "2021-01-01T00:00:00.000Z"; //new Date().toISOString();

    const queryBody = {
      query: {
        date_utc: upcoming ? { $gte: now } : { $lte: now },
      },
      options: {
        limit: PAGE_SIZE,
        offset: this.offset,
        sort: {
          date_utc: upcoming ? 1 : -1,
        },
      },
    };

    try {
      const res = await fetch(`${this.BASE_URL}/launches/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryBody),
      });

      const json = await res.json();

      if (!json.docs || json.docs.length === 0) {
        this.noMore = true;
        return [];
      }

      // Stop fetching if we've reached the end
      if (this.offset + PAGE_SIZE >= json.totalDocs) {
        this.noMore = true;
      }

      this.offset += PAGE_SIZE;

      return json.docs.map(this.normalizeLaunch);
    } catch (err) {
      console.error("SpaceX API fetch error:", err);
      this.noMore = true;
      return [];
    }
  }

  reset() {
    this.offset = 0;
    this.noMore = false;
  }
}

export default new SpacexAPI();
