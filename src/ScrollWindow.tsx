import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Image,
} from "react-native";
import { LaunchItem } from "./API/types";

type ScrollWindowProps = {
  launches: LaunchItem[];
  loading: boolean;
  noMoreData: boolean;
  onLoadMore: () => void;
};

const CountdownItem: React.FC<{ launchDateUTC: string }> = ({
  launchDateUTC,
}) => {
  const countdown = useCountdown(launchDateUTC);
  return <Text>{countdown}</Text>;
};

const ScrollWindow: React.FC<ScrollWindowProps> = ({
  launches,
  loading,
  noMoreData,
  onLoadMore,
}) => {
  return (
    <FlatList
      data={launches}
      keyExtractor={(item) => item.id}
      onEndReached={() => {
        if (!loading && !noMoreData) {
          onLoadMore();
        }
      }}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        loading ? (
          <View style={styles.footer}>
            <ActivityIndicator size="small" />
          </View>
        ) : noMoreData ? (
          <View style={styles.footer}>
            <Text>No more launches</Text>
          </View>
        ) : null
      }
      renderItem={({ item }) => {
        const isFuture = new Date(item.launchDateUTC).getTime() > Date.now();

        // Success/failure dot color
        let dotColor = "#AAA"; // Default gray
        if (item.success === true) dotColor = "#4CAF50";
        else if (item.success === false) dotColor = "#F44336";

        return (
          <View style={styles.item}>
            <Image
              style={[
                styles.missionPatch,
                !item.missionPatch && styles.roundImage,
              ]}
              resizeMode="contain"
              source={
                item.missionPatch
                  ? { uri: item.missionPatch }
                  : require("../assets/T-Zero-logo-primary.jpeg")
              }
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.missionName}</Text>
              <Text>{item.rocketName}</Text>
              <Text>{item.launchpadName}</Text>
              <Text>
                {new Date(item.launchDateUTC).toLocaleString(undefined, {
                  timeZoneName: "short",
                })}
              </Text>
              <CountdownItem launchDateUTC={item.launchDateUTC} />
            </View>
            <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          </View>
        );
      }}
    />
  );
};

// Countdown helper same as before
export function useCountdown(targetDateUTC: string): string {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const target = new Date(targetDateUTC).getTime();
  const diff = target - now;
  const absDiff = Math.abs(diff);

  const seconds = Math.floor(absDiff / 1000) % 60;
  const minutes = Math.floor(absDiff / (1000 * 60)) % 60;
  const hours = Math.floor(absDiff / (1000 * 60 * 60)) % 24;
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const isPast = diff < 0;

  const prefix = isPast ? "T+" : "T-";

  if (absDiff > 48 * 60 * 60 * 1000) {
    // More than 48h away from now → show local datetime
    return new Date(targetDateUTC).toLocaleString(undefined, {
      timeZoneName: "short",
    });
  }

  if (days > 0) {
    return `${prefix}${days}d ${hours}h ${minutes}m`;
  }

  return `${prefix}${String(hours).padStart(2, "0")}h ${String(
    minutes,
  ).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`;
}

const styles = StyleSheet.create({
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
  footer: {
    paddingVertical: 20,
    alignItems: "center",
  },
});

export default ScrollWindow;
