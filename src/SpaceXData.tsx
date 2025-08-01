import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";

type Launch = {
  id: string;
  name: string;
  date_utc: string;
  upcoming: boolean;
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

const SpaceXData = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [rockets, setRockets] = useState<Record<string, Rocket>>({});
  const [launchpads, setLaunchpads] = useState<Record<string, Launchpad>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);

      const [launchesData, rocketsData, launchpadsData] = await Promise.all([
        fetchLaunches(),
        fetchRockets(),
        fetchLaunchpads(),
      ]);

      setLaunches(launchesData);
      setRockets(Object.fromEntries(rocketsData.map((r) => [r.id, r])));
      setLaunchpads(Object.fromEntries(launchpadsData.map((l) => [l.id, l])));

      setLoading(false);
    };

    fetchAllData().catch(console.error);
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <FlatList
      data={launches}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const rocket = rockets[item.rocket];
        const launchpad = launchpads[item.launchpad];
        return (
          <View style={styles.item}>
            <Image
              style={styles.missionPatch}
              resizeMode="contain"
              source={{ uri: item.links.patch.small }}
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
              <Text>{item.upcoming ? "Upcoming" : "Past"}</Text>
            </View>
          </View>
        );
      }}
    />
  );
};

// Dedicated fetch functions
async function fetchLaunches() {
  return fetchAPIData<Launch>("launches");
}
async function fetchRockets() {
  return fetchAPIData<Rocket>("rockets");
}
async function fetchLaunchpads() {
  return fetchAPIData<Launchpad>("launchpads");
}

// Generic fetcher for any endpoint
async function fetchAPIData<T>(endpoint: string): Promise<T[]> {
  try {
    const res = await fetch(`https://api.spacexdata.com/v4/${endpoint}`);
    if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
    const data: T[] = await res.json();
    return data;
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    return [];
  }
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    height: "auto",
    width: "100%",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  missionPatch: {
    height: 75,
    width: 75,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
});

export default SpaceXData;
