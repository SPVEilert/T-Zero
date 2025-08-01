import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";

// Types
type Launch = {
  id: string;
  name: string;
  date_utc: string;
  upcoming: boolean;
  success: boolean;
  links: {
    patch: {
      small: string;
      large: string;
    };
  };
  rocket: string;
  payloads: string[];
  launchpad: string;
};

type Rocket = {
  id: string;
  name: string;
};

type Launchpad = {
  id: string;
  name: string;
  locality?: string;
};

// Component
const SpaceXData = () => {
  const [upcomingLaunches, setUpcomingLaunches] = useState<Launch[]>([]);
  const [pastLaunches, setPastLaunches] = useState<Launch[]>([]);
  const [rockets, setRockets] = useState<Record<string, Rocket>>({});
  const [launchpads, setLaunchpads] = useState<Record<string, Launchpad>>({});
  const [initialLoading, setInitialLoading] = useState(true);
  const [pastOffset, setPastOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [noMorePast, setNoMorePast] = useState(false);
  const [noMoreUpcoming, setNoMoreUpcoming] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    const fetchInitialData = async () => {
      setInitialLoading(true);

      const [upcoming, past, rocketData, launchpadData] = await Promise.all([
        fetchUpcomingLaunches(),
        fetchPastLaunches(0),
        fetchRockets(),
        fetchLaunchpads(),
      ]);

      setUpcomingLaunches(upcoming);
      setPastLaunches(past);
      setRockets(Object.fromEntries(rocketData.map((r) => [r.id, r])));
      setLaunchpads(Object.fromEntries(launchpadData.map((l) => [l.id, l])));

      setPastOffset(PAGE_SIZE);
      setInitialLoading(false);
    };

    fetchInitialData().catch(console.error);
  }, []);

  const loadMorePastLaunches = useCallback(async () => {
    if (loading || noMorePast) return;
    setLoading(true);
    const morePast = await fetchPastLaunches(pastOffset);
    if (morePast.length === 0) {
      setNoMorePast(true);
      setLoading(false);
      return;
    }
    setPastLaunches((prev) => [...prev, ...morePast]);
    setPastOffset((prev) => prev + PAGE_SIZE);
    setLoading(false);
  }, [pastOffset, loading]);

  const allLaunches = [...upcomingLaunches, ...pastLaunches];

  if (initialLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={allLaunches}
      keyExtractor={(item) => item.id}
      inverted
      onEndReached={loadMorePastLaunches}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" />
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const rocket = rockets[item.rocket];
        const launchpad = launchpads[item.launchpad];
        const isFuture = new Date(item.date_utc).getTime() > Date.now();
        // Success/failure dot color
        let dotColor = "#AAA"; // Default gray
        if (item.success === true) dotColor = "#4CAF50";
        else if (item.success === false) dotColor = "#F44336";

        return (
          <View style={styles.item}>
            <Image
              style={[
                styles.missionPatch,
                !item.links.patch.small && styles.roundImage,
              ]}
              resizeMode="contain"
              source={
                item.links.patch.small
                  ? { uri: item.links.patch.small }
                  : require("../assets/spacex-logo.jpeg")
              }
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.name}</Text>
              <Text>{rocket ? `${rocket.name}` : "Rocket: Unknown"}</Text>
              <Text>
                {launchpad
                  ? `${launchpad.name} ${launchpad.locality}`
                  : "Launchpad: Unknown"}
              </Text>
              <Text>
                {new Date(item.date_utc).toLocaleString(undefined, {
                  timeZoneName: "short",
                })}
              </Text>
              <Text>{isFuture ? renderCountdown(item.date_utc) : null}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          </View>
        );
      }}
    />
  );
};

function renderCountdown(dateStr: string) {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) return "Launched";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return `T- ${hours}h ${minutes}m ${seconds}s`;
}

// API Helpers
const BASE_URL = "https://api.spacexdata.com/v4";

async function fetchAPIData<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`);
    return await res.json();
  } catch (err) {
    console.error(`Fetch error for ${endpoint}`, err);
    return [];
  }
}

async function fetchUpcomingLaunches(): Promise<Launch[]> {
  const body = {
    query: { date_utc: { $gt: new Date().toISOString() } },
    options: { sort: { date_utc: 1 } },
  };
  return await postQuery<Launch>("launches/query", body);
}

async function fetchPastLaunches(offset: number): Promise<Launch[]> {
  const body = {
    query: { date_utc: { $lte: new Date().toISOString() } },
    options: { limit: 20, offset, sort: { date_utc: -1 } },
  };
  return await postQuery<Launch>("launches/query", body);
}

async function fetchRockets() {
  return fetchAPIData<Rocket>("rockets");
}

async function fetchLaunchpads() {
  return fetchAPIData<Launchpad>("launchpads");
}

async function postQuery<T>(endpoint: string, body: object): Promise<T[]> {
  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return json.docs;
  } catch (err) {
    console.error(`POST query error for ${endpoint}`, err);
    return [];
  }
}

// Styles
const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  missionPatch: {
    height: 75,
    width: 75,
    marginRight: 10,
  },
  textContainer: {
    flexShrink: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: "auto",
    marginRight: 10,
    flexShrink: 0,
  },
  roundImage: {
    borderRadius: 37.5,
  },
});

export default SpaceXData;
