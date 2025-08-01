import React, { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from "react-native";

type Launch = {
  id: string;
  name: string;
  date_utc: string;
  upcoming: boolean;
};

const SpaceXData = () => {
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const spacexData = fetchAPIData("https://api.spacexdata.com/v4/launches");
    spacexData.then((data) => {
      setLaunches(data);
    });
    setLoading(false);
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
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title}>{item.name}</Text>
          <Text>{new Date(item.date_utc).toLocaleString()}</Text>
          <Text>{item.upcoming ? "Upcoming" : "Past"}</Text>
        </View>
      )}
    />
  );
};

async function fetchAPIData(url: string): Promise<Launch[]> {
  try {
    const res = await fetch(url);
    return await res.json();
  } catch (error) {
    console.error("Error fetching API data:", error);
    return [];
  }
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  item: { padding: 10, borderBottomWidth: 1, borderBottomColor: "#ccc" },
  title: { fontWeight: "bold" },
});

export default SpaceXData;
