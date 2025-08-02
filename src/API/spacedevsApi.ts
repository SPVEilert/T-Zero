import { LaunchItem } from "./types";

export type SpaceDevsLaunch = {
  id: string;
  name: string;
  net: string; // date-time string
  upcoming: boolean;
  status: { id: number; name: string };
  image?: string | null;
  rocket: {
    configuration?: {
      name: string;
    };
  };
  pad?: {
    name: string;
  };
};

const PAGE_SIZE = 20;

class spacedevsAPI {
  private page = 1;
  private noMore = false;

  private BASE_URL = "https://ll.thespacedevs.com/2.0.0";

  normalizeLaunch(launch: SpaceDevsLaunch): LaunchItem {
    return {
      id: `spacedevs_${launch.id}`,
      missionPatch: launch.image || undefined,
      missionName: launch.name,
      rocketName: launch.rocket?.configuration?.name || "Unknown Rocket",
      launchpadName: launch.pad?.name || "Unknown Launchpad",
      launchDateUTC: launch.net,
      success:
        launch.status?.id === 3 // Success status code
          ? true
          : launch.status?.id === 4 // Failure status code
            ? false
            : null,
      upcoming: launch.upcoming,
      source: "spacedevs" as const,
    };
  }

  async fetchLaunches(upcoming: boolean): Promise<LaunchItem[]> {
    if (this.noMore) return [];

    try {
      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: ((this.page - 1) * PAGE_SIZE).toString(),
        ordering: upcoming ? "net" : "-net",
        [upcoming ? "net__gt" : "net__lte"]: toISODateOnly(new Date()),
      });

      const res = await fetch(`${this.BASE_URL}/launch/?${params.toString()}`);

      if (res.status === 429) {
        throw new Error("SpaceDevs rate limited (429)");
      }

      const json = await res.json();

      if (!json.results || json.results.length === 0) {
        this.noMore = true;
        return [];
      }

      this.page += 1;
      return json.results.map(this.normalizeLaunch);
    } catch (err: any) {
      console.warn("SpaceDevs failed:", err.message);
      return [];
    }
  }

  reset() {
    this.page = 1;
    this.noMore = false;
  }
}

function toISODateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

export default new spacedevsAPI();
