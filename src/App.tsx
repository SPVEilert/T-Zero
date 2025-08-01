import React from "react";
import { SafeAreaView, StyleSheet } from "react-native";
import Home from "./Home";

const App = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Home />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
});

export default App;
